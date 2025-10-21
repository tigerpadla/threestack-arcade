let ducks;
let duckCount = 1;
let duckImageNames = [
    "assets/images/duck-left.gif",
    "assets/images/duck-right.gif",
];
let duckWidth = 120;
let duckHeight = 116;
let duckVelocityX = 5;
let duckVelocityY = 5;

let gameWidth = window.screen.width;
let gameHeight = (window.screen.height * 3) / 4;

let score = 0;
let quackTimer = null;

// bullets tracking
let bullets = 0;
let roundEndedWithLaugh = false;

// --- new: level/round state ---
let currentLevel = 1;
let currentRound = 1;
const roundsPerLevel = 3;
const maxLevels = 5;
let missesThisLevel = 0;

// level settings: min, max, speed multiplier (applied to base velocities)
const levelSettings = [
    /* level 1 */ { min: 1, max: 3, speed: 1 }, // Normal
    /* level 2 */ { min: 2, max: 5, speed: 1 }, // Normal
    /* level 3 */ { min: 3, max: 7, speed: 1.2 }, // Slower Fast
    /* level 4 */ { min: 5, max: 8, speed: 1.4 }, // Slower Fast+
    /* level 5 */ { min: 8, max: 10, speed: 1.6 }, // Slower Very Fast
];

const baseVelocityX = 5;
const baseVelocityY = 5;

function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function startQuackLoop() {
    if (quackTimer || !ducks || ducks.length === 0) {
        return;
    }

    quackTimer = setTimeout(() => {
        quackTimer = null;

        const flyingDucks = ducks.filter((duck) => duck.state === "flying");
        if (flyingDucks.length > 0) {
            new Audio("assets/sounds/duck-quack.mp3").play();
        }

        if (ducks.length > 0) {
            startQuackLoop();
        }
    }, randomDelay(2500, 5000));
}

function stopQuackLoop() {
    if (quackTimer) {
        clearTimeout(quackTimer);
        quackTimer = null;
    }
}

// new: show level announcement then call callback
function showLevelAnnouncement(level, cb) {
    const overlay = document.getElementById("level-announcement");
    const text = document.getElementById("announcement-text");
    if (!overlay || !text) {
        if (typeof cb === "function") cb();
        return;
    }
    text.textContent = `Level ${level}`;
    overlay.classList.remove("hidden");
    // keep visible for 1800ms, then hide and call callback
    setTimeout(() => {
        overlay.classList.add("hidden");
        if (typeof cb === "function") cb();
    }, 1800);
}

// new: startRound handles showing level announcement at start of a level (round 1)
function startRound() {
    updateUI();
    if (currentRound === 1) {
        showLevelAnnouncement(currentLevel, addDucks);
    } else {
        addDucks();
    }
}

window.onload = function () {
    // replace initial addDucks with startRound so announcement shows on first level
    setTimeout(startRound, 2000); // Wait 2 seconds and then announce/start
    setInterval(moveDucks, 1000 / 60); // 60 frames per second

    // Miss-click handler: clicking anywhere that's not a duck consumes a bullet
    document.addEventListener("click", function (e) {
        // if no ducks or no bullets, nothing to do
        if (!ducks || ducks.length === 0 || bullets <= 0) {
            return;
        }
        // If click target is a duck (has class 'duck'), it's a hit and handled separately.
        if (
            e.target &&
            e.target.classList &&
            e.target.classList.contains("duck")
        ) {
            return;
        }
        // Also ignore clicks on scoreboard area
        let scoreboard = document.querySelector(".scoreboard");
        if (scoreboard && scoreboard.contains(e.target)) {
            return;
        }

        // Miss: consume one bullet and update UI
        bullets = Math.max(0, bullets - 1);
        renderBullets();

        // play shooting sound even on misses
        new Audio("assets/sounds/duck-shot.mp3").play();

        // If bullets run out while ducks remain -> make remaining ducks fly away upward
        if (bullets === 0 && ducks && ducks.length > 0) {
            roundEndedWithLaugh = true;
            // set remaining non-shot/non-falling ducks to fly away
            ducks.forEach((d) => {
                if (d.state === "flying") {
                    d.state = "flyingAway";
                    // give a strong upward velocity
                    d.velocityY = -10;
                    // optionally reduce horizontal movement while fleeing upward
                    d.velocityX = d.velocityX * 0.2;

                    // count this duck as missed immediately so hearts disappear now
                    missesThisLevel = (missesThisLevel || 0) + 1;
                }
            });
            updateUI(); // reflect missed hearts immediately
            stopQuackLoop();
        }
    });
};

function updateUI() {
    const scoreEl = document.getElementById("score");
    const missesContainer = document.getElementById("misses");

    // update score
    if (scoreEl) scoreEl.textContent = score;

    // dynamic miss limit: levels 1-2 -> 3 misses, levels 3+ -> 5 misses
    const missLimit = currentLevel >= 3 ? 5 : 3;
    // remaining hearts = missLimit - missesThisLevel (clamped >= 0)
    const remaining = Math.max(0, missLimit - (missesThisLevel || 0));

    // render heart icons
    if (missesContainer) {
        missesContainer.innerHTML = "";
        for (let i = 0; i < remaining; i++) {
            const img = document.createElement("img");
            img.className = "heart-icon";
            img.src = "assets/images/duck-red-icon.png";
            img.alt = "Life";
            img.draggable = false;
            missesContainer.appendChild(img);
        }
    }
    renderBullets(); // refresh bullets too
}

function addDucks() {
    ducks = [];

    // pick settings for current level
    const settings =
        levelSettings[
            Math.max(0, Math.min(levelSettings.length - 1, currentLevel - 1))
        ];
    // random duck count based on level
    duckCount =
        Math.floor(Math.random() * (settings.max - settings.min + 1)) +
        settings.min;

    // bullets = duckCount + 1
    bullets = duckCount + 1;
    // reset round-ended flag when starting/continuing rounds
    roundEndedWithLaugh = false;
    // apply speed multipliers
    duckVelocityX = baseVelocityX * settings.speed;
    duckVelocityY = baseVelocityY * settings.speed;

    renderBullets();
    updateUI();

    for (let i = 0; i < duckCount; i++) {
        let duckImageName = duckImageNames[Math.floor(Math.random() * 2)];
        let duckImage = document.createElement("img");
        duckImage.src = duckImageName;
        duckImage.width = duckWidth;
        duckImage.height = duckHeight;
        duckImage.draggable = false;
        duckImage.style.position = "absolute";
        duckImage.dataset.state = "flying";

        // mark as duck so miss handler can ignore hits
        duckImage.classList.add("duck");

        duckImage.onclick = function (event) {
            // prevent document-level miss handler from running
            if (event && event.stopPropagation) {
                event.stopPropagation();
            }

            if (
                this.dataset.state === "shot" ||
                this.dataset.state === "falling"
            ) {
                return;
            }
            const duckEntry = ducks.find((entry) => entry.image === this);
            if (!duckEntry) {
                return;
            }

            // consume one bullet for this shot and update UI
            bullets = Math.max(0, bullets - 1);
            renderBullets();

            // play shot sound and update score
            new Audio("assets/sounds/duck-shot.mp3").play();
            score += 1;
            document.getElementById("score").innerHTML = score;

            // Immediately set clicked duck to falling (no intermediate 'shot' delay)
            this.dataset.state = "falling";
            duckEntry.state = "falling";
            // stop horizontal motion
            duckEntry.velocityX = 0;
            duckEntry.velocityY = 0;

            // initialize falling physics & play fall audio
            duckEntry.fallVelocity = 6;
            duckEntry.maxFallVelocity = 20;
            duckEntry.gravity = 0.9;
            duckEntry.fallAudio = new Audio("assets/sounds/duck-fall.mp3");
            duckEntry.fallAudio.loop = true;
            duckEntry.fallAudio.play();

            // set fall image immediately
            this.classList.remove("duck-shot-image");
            this.src = "assets/images/duck-fall.gif";

            // If bullets ran out and there are still flying ducks, make them fly away
            const flyingDucks = ducks.filter((d) => d.state === "flying");
            if (bullets === 0 && flyingDucks.length > 0) {
                roundEndedWithLaugh = true;
                flyingDucks.forEach((d) => {
                    d.state = "flyingAway";
                    d.velocityY = -10;
                    d.velocityX = (d.velocityX || 0) * 0.2;

                    // count misses immediately for each fleeing duck
                    missesThisLevel = (missesThisLevel || 0) + 1;
                });
                updateUI(); // update hearts right away
                stopQuackLoop();
                return;
            }
        };
        document.body.appendChild(duckImage);

        let duck = {
            image: duckImage,
            x: randomPosition(gameWidth - duckWidth),
            y: randomPosition(gameHeight - duckHeight),
            velocityX: duckVelocityX,
            velocityY: duckVelocityY,
            state: "flying",
            fallVelocity: 0,
            maxFallVelocity: 0,
            gravity: 0,
            fallAudio: null,
        };
        duck.image.style.left = String(duck.x) + "px"; // X position
        duck.image.style.top = String(duck.y) + "px"; // Y Position

        if (duck.image.src.includes(duckImageNames[0])) {
            duck.velocityX = -duckVelocityX; // Going left
        }
        ducks.push(duck);
    }
    startQuackLoop();
}

function moveDucks() {
    for (let i = ducks.length - 1; i >= 0; i--) {
        let duck = ducks[i];

        // handle already-shot (static) ducks
        if (duck.state === "shot") {
            continue;
        }

        // handle falling ducks
        if (duck.state === "falling") {
            duck.fallVelocity = Math.min(
                (duck.fallVelocity || 0) + (duck.gravity || 0),
                duck.maxFallVelocity || 20
            );
            duck.y += duck.fallVelocity;

            if (duck.y >= gameHeight - duckHeight) {
                duck.y = gameHeight - duckHeight;
                duck.image.style.top = `${duck.y}px`;

                if (duck.fallAudio) {
                    duck.fallAudio.pause();
                    duck.fallAudio.currentTime = 0;
                    duck.fallAudio = null;
                }
                new Audio("assets/sounds/duck-land.mp3").play();

                if (duck.image.parentElement) {
                    duck.image.parentElement.removeChild(duck.image);
                }
                ducks.splice(i, 1);

                if (ducks.length === 0) {
                    endRound();
                    roundEndedWithLaugh = false;
                }
                continue;
            }

            duck.image.style.top = `${duck.y}px`;
            continue;
        }

        // handle flying-away ducks (when bullets ran out)
        if (duck.state === "flyingAway") {
            // move upwards
            duck.y += duck.velocityY;
            // increase upward speed (more negative)
            duck.velocityY = (duck.velocityY || -4) - 0.5;
            // optional small horizontal drift
            duck.x += (duck.velocityX || 0) * 0.1;

            // update position
            duck.image.style.top = `${duck.y}px`;
            duck.image.style.left = `${duck.x}px`;

            // if duck has flown beyond the top of the game area, remove it
            if (duck.y + duckHeight < 0) {
                // removal only — miss was already counted when duck began flying away
                if (duck.image.parentElement) {
                    duck.image.parentElement.removeChild(duck.image);
                }
                ducks.splice(i, 1);

                // when last duck removed decide next action
                if (ducks.length === 0) {
                    endRound();
                    roundEndedWithLaugh = false;
                }
            }
            continue;
        }

        duck.x += duck.velocityX;
        if (duck.x < 0 || duck.x + duckWidth > gameWidth) {
            duck.x -= duck.velocityX;
            duck.velocityX *= -1;
            duck.image.src =
                duck.velocityX < 0 ? duckImageNames[0] : duckImageNames[1];
        }
        duck.y += duck.velocityY;
        if (duck.y < 0 || duck.y + duckHeight > gameHeight) {
            duck.y -= duck.velocityY;
            duck.velocityY *= -1;
        }
        duck.image.style.left = `${duck.x}px`;
        duck.image.style.top = `${duck.y}px`;
    }
}

// replace direct calls to addDog/addDogLaugh when ducks run out with centralized endRound()
function endRound() {
    stopQuackLoop();

    // show appropriate popup
    if (roundEndedWithLaugh) {
        addDogLaugh();
    } else {
        addDog(duckCount);
    }

    // after popup delay, decide next action
    setTimeout(() => {
        // dynamic miss limit: levels 1-2 -> 3 misses, levels 3+ -> 5 misses
        const missLimit = currentLevel >= 3 ? 5 : 3;

        // if player missed missLimit or more ducks in this level -> game over
        if (missesThisLevel >= missLimit) {
            gameOver();
            return;
        }

        // advance round or level
        if (currentRound < roundsPerLevel) {
            currentRound++;
        } else {
            // finished this level
            if (currentLevel < maxLevels) {
                currentLevel++;
            } else {
                // completed all levels
                gameComplete();
                return;
            }
            // reset rounds/misses for new level
            currentRound = 1;
            missesThisLevel = 0;
        }
        updateUI();
        // start next round via startRound() so level announcement runs when needed
        startRound();
    }, 3000);
}

function gameOver() {
    // show Game Over overlay and let player restart manually
    showGameOverAnnouncement();
}

function gameComplete() {
    // show a brief "Congrats" announcement with final score, then restart game
    showGameCompleteAnnouncement();
}

// new: show game-complete announcement and wait for player to restart via button
function showGameCompleteAnnouncement() {
    const overlay = document.getElementById("game-complete-announcement");
    const scoreEl = document.getElementById("final-score");
    const playBtn = document.getElementById("game-complete-play");

    if (!overlay) {
        // fallback: reset game if overlay missing
        currentLevel = 1;
        currentRound = 1;
        missesThisLevel = 0;
        score = 0;
        bullets = 0;
        roundEndedWithLaugh = false;
        updateUI();
        setTimeout(startRound, 500);
        return;
    }

    // update score text and show overlay (do NOT auto-hide)
    if (scoreEl) scoreEl.textContent = String(score);
    overlay.classList.remove("hidden");

    // ensure single handler: replace node to remove any previous listeners, then attach reload
    if (playBtn) {
        const newBtn = playBtn.cloneNode(true);
        playBtn.parentNode.replaceChild(newBtn, playBtn);
        newBtn.addEventListener("click", () => {
            // reload the page to restart the game
            window.location.reload();
        });
    }
}

function addDog(duckCount) {
    let dogImage = document.createElement("img");
    dogImage.classList.add("dog-popup");
    if (duckCount === 1) {
        dogImage.src = "assets/images/dog-duck1.png";
        dogImage.width = 230;
        dogImage.height = 204;
    } else if (duckCount === 2) {
        dogImage.src = "assets/images/dog-duck2.png";
        dogImage.width = 296;
        dogImage.height = 204;
    } else {
        dogImage.src = "assets/images/dog-duck3.png";
        dogImage.width = 368;
        dogImage.height = 264;
    }
    dogImage.draggable = false;

    dogImage.style.position = "fixed";
    dogImage.style.bottom = "0px";
    dogImage.style.left = "50%";
    document.body.appendChild(dogImage);

    let dogScoreSound = new Audio("assets/sounds/dog-score.mp3");
    dogScoreSound.play();

    setTimeout(function () {
        if (dogImage.parentElement) document.body.removeChild(dogImage);
    }, 3000);
}

function addDogLaugh() {
    let dogImage = document.createElement("img");
    dogImage.classList.add("dog-popup");
    dogImage.src = "assets/images/dog-laugh.gif";
    dogImage.width = 150;
    dogImage.height = 210;
    dogImage.draggable = false;

    dogImage.style.position = "fixed";
    dogImage.style.bottom = "0px";
    dogImage.style.left = "50%";
    document.body.appendChild(dogImage);

    let dogLaughSound = new Audio("assets/sounds/dog-laugh.mp3");
    dogLaughSound.play();

    setTimeout(function () {
        if (dogImage.parentElement) document.body.removeChild(dogImage);
    }, 3000);
}

// render bullets as icons
function renderBullets() {
    let container = document.getElementById("bullets");
    if (!container) return;
    container.innerHTML = "";
    for (let i = 0; i < bullets; i++) {
        let b = document.createElement("img");
        b.classList.add("bullet-icon");
        b.src = "assets/images/duck-em-up-bullet.png";
        b.draggable = false;
        container.appendChild(b);
    }
}

function randomPosition(limit) {
    return Math.floor(Math.random() * limit);
}

// ensure UI initialised
window.addEventListener("load", updateUI);

// new: show game-over announcement and hook restart button
function showGameOverAnnouncement() {
    const overlay = document.getElementById("game-over-announcement");
    const restartBtn = document.getElementById("game-over-restart");
    if (!overlay) return;

    overlay.classList.remove("hidden");

    // ensure single handler: replace with a fresh node then attach simple reload
    if (restartBtn) {
        const newBtn = restartBtn.cloneNode(true);
        restartBtn.parentNode.replaceChild(newBtn, restartBtn);
        newBtn.addEventListener("click", () => {
            // reload the page to restart the game
            window.location.reload();
        });
    }
}
