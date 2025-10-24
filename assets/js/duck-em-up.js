/* jshint esversion: 6, loopfunc: true */
/*
 Duck 'Em Up — main game script
 Sections:
  - Constants & state
  - Utility helpers
  - UI rendering and overlays
  - Duck creation & movement (game loop)
  - Round / level control and end-of-round UI
  - Event handlers / initialization
*/

/* -------------------------
   Constants & game state
   ------------------------- */
let ducks;
let duckCount = 1;
const duckImageNames = [
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

let overlayClickHandler = null;

let bullets = 0;
let roundEndedWithLaugh = false;

let currentLevel = 1;
let currentRound = 1;
const roundsPerLevel = 3;
const maxLevels = 5;
let missesThisLevel = 0;

const levelSettings = [
    { min: 1, max: 3, speed: 1 },
    { min: 2, max: 5, speed: 1 },
    { min: 3, max: 7, speed: 1.2 },
    { min: 5, max: 8, speed: 1.4 },
    { min: 8, max: 10, speed: 1.6 },
];

const baseVelocityX = 5;
const baseVelocityY = 5;

/* -------------------------
   Utility helpers
   ------------------------- */
function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPosition(limit) {
    return Math.floor(Math.random() * limit);
}

/* -------------------------
   Sounds / quack loop
   ------------------------- */
function startQuackLoop() {
    if (quackTimer || !ducks || ducks.length === 0) return;

    quackTimer = setTimeout(() => {
        quackTimer = null;
        const flyingDucks = ducks.filter((duck) => duck.state === "flying");
        if (flyingDucks.length > 0) {
            new Audio("assets/sounds/duck-quack.mp3").play();
        }
        if (ducks.length > 0) startQuackLoop();
    }, randomDelay(2500, 5000));
}

function stopQuackLoop() {
    if (quackTimer) {
        clearTimeout(quackTimer);
        quackTimer = null;
    }
}

/* -------------------------
   UI rendering (score, bullets, misses)
   ------------------------- */
function renderBullets() {
    const container = document.getElementById("bullets");
    if (!container) return;
    container.innerHTML = "";
    for (let i = 0; i < bullets; i++) {
        const b = document.createElement("img");
        b.classList.add("bullet-icon");
        b.src = "assets/images/duck-em-up-bullet.png";
        b.draggable = false;
        container.appendChild(b);
    }
}

function updateUI() {
    const scoreEl = document.getElementById("score");
    const missesContainer = document.getElementById("misses");

    if (scoreEl) scoreEl.textContent = score;

    const missLimit = currentLevel >= 3 ? 5 : 3;
    const remaining = Math.max(0, missLimit - (missesThisLevel || 0));

    if (!missesContainer) {
        renderBullets();
        return;
    }

    if (!ducks || ducks.length === 0) {
        missesContainer.style.display = "none";
        missesContainer.innerHTML = "";
    } else {
        missesContainer.style.display = "flex";
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

    renderBullets();
}

/* -------------------------
   Duck creation & movement
   ------------------------- */
function addDucks() {
    ducks = [];

    const settings =
        levelSettings[
            Math.max(0, Math.min(levelSettings.length - 1, currentLevel - 1))
        ];
    duckCount =
        Math.floor(Math.random() * (settings.max - settings.min + 1)) +
        settings.min;

    bullets = duckCount + 1;
    roundEndedWithLaugh = false;
    duckVelocityX = baseVelocityX * settings.speed;
    duckVelocityY = baseVelocityY * settings.speed;

    renderBullets();

    for (let i = 0; i < duckCount; i++) {
        const duckImageName = duckImageNames[Math.floor(Math.random() * 2)];
        const duckImage = document.createElement("img");
        duckImage.src = duckImageName;
        duckImage.width = duckWidth;
        duckImage.height = duckHeight;
        duckImage.draggable = false;
        duckImage.style.position = "absolute";
        duckImage.dataset.state = "flying";
        duckImage.classList.add("duck");

        // click handler for the duck image (scoped to this duck element)
        duckImage.onclick = function (event) {
            if (event && event.stopPropagation) event.stopPropagation();

            if (
                this.dataset.state === "shot" ||
                this.dataset.state === "falling"
            )
                return;

            const duckEntry = ducks.find((entry) => entry.image === this);
            if (!duckEntry) return;

            bullets = Math.max(0, bullets - 1);
            renderBullets();

            new Audio("assets/sounds/duck-shot.mp3").play();
            score += 1;
            const scoreNode = document.getElementById("score");
            if (scoreNode) scoreNode.innerHTML = score;

            this.dataset.state = "shot";
            duckEntry.state = "shot";
            this.classList.add("duck-shot-image");
            this.src = "assets/images/duck-shot.png";
            duckEntry.velocityX = 0;
            duckEntry.velocityY = 0;

            setTimeout(() => {
                if (!duckEntry || duckEntry.state !== "shot") return;

                this.dataset.state = "falling";
                duckEntry.state = "falling";

                duckEntry.fallVelocity = 6;
                duckEntry.maxFallVelocity = 20;
                duckEntry.gravity = 0.9;
                duckEntry.fallAudio = new Audio("assets/sounds/duck-fall.mp3");
                duckEntry.fallAudio.loop = true;
                duckEntry.fallAudio.play();

                this.classList.remove("duck-shot-image");
                this.src = "assets/images/duck-fall.gif";

                const flyingDucks = ducks.filter((d) => d.state === "flying");
                if (bullets === 0 && flyingDucks.length > 0) {
                    roundEndedWithLaugh = true;
                    flyingDucks.forEach((d) => {
                        d.state = "flyingAway";
                        d.velocityY = -10;
                        d.velocityX = (d.velocityX || 0) * 0.2;
                        missesThisLevel = (missesThisLevel || 0) + 1;
                    });
                    updateUI();
                    stopQuackLoop();
                }
            }, 200);
        };

        document.body.appendChild(duckImage);

        const duck = {
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

        duck.image.style.left = String(duck.x) + "px";
        duck.image.style.top = String(duck.y) + "px";

        if (duck.image.src.includes(duckImageNames[0])) {
            duck.velocityX = -duckVelocityX;
        }
        ducks.push(duck);
    }

    updateUI();
    startQuackLoop();
}

function moveDucks() {
    for (let i = ducks.length - 1; i >= 0; i--) {
        const duck = ducks[i];

        if (duck.state === "shot") continue;

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

        if (duck.state === "flyingAway") {
            duck.y += duck.velocityY;
            duck.velocityY = (duck.velocityY || -4) - 0.5;
            duck.x += (duck.velocityX || 0) * 0.1;

            duck.image.style.top = `${duck.y}px`;
            duck.image.style.left = `${duck.x}px`;

            if (duck.y + duckHeight < 0) {
                if (duck.image.parentElement) {
                    duck.image.parentElement.removeChild(duck.image);
                }
                ducks.splice(i, 1);

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

/* -------------------------
   Round / level control
   ------------------------- */
function endRound() {
    stopQuackLoop();

    if (roundEndedWithLaugh) {
        addDogLaugh();
    } else {
        addDog(duckCount);
    }

    setTimeout(() => {
        const missLimit = currentLevel >= 3 ? 5 : 3;

        if (missesThisLevel >= missLimit) {
            gameOver();
            return;
        }

        if (currentRound < roundsPerLevel) {
            currentRound++;
        } else {
            if (currentLevel < maxLevels) {
                currentLevel++;
            } else {
                gameComplete();
                return;
            }
            currentRound = 1;
            missesThisLevel = 0;
        }
        updateUI();
        startRound();
    }, 3000);
}

function gameOver() {
    showGameOverAnnouncement();
}

function gameComplete() {
    showGameCompleteAnnouncement();
}

/* -------------------------
   Overlays / popups
   ------------------------- */

/* Helper: attach a one-time click handler so clicking anywhere while an overlay is visible reloads the page */
function attachOverlayClickReload() {
    // ensure no duplicate handlers
    removeOverlayClickHandler();
    overlayClickHandler = function () {
        window.location.reload();
    };
    // Use capture + once to ensure the handler fires and is removed immediately
    document.addEventListener("click", overlayClickHandler, {
        once: true,
        capture: true,
    });
}

/* Helper: remove the overlay click handler if present */
function removeOverlayClickHandler() {
    if (!overlayClickHandler) return;
    // remove with same capture option
    try {
        document.removeEventListener("click", overlayClickHandler, {
            capture: true,
        });
    } catch (_) {
        // some environments may not accept option object in removeEventListener; try boolean fallback
        document.removeEventListener("click", overlayClickHandler, true);
    }
    overlayClickHandler = null;
}

function showLevelAnnouncement(level, cb) {
    const overlay = document.getElementById("level-announcement");
    const text = document.getElementById("announcement-text");
    if (!overlay || !text) {
        if (typeof cb === "function") cb();
        return;
    }

    const missesEl = document.getElementById("misses");
    if (level === 1 && missesEl) {
        missesEl.dataset._prevDisplay = missesEl.style.display || "";
        missesEl.style.display = "none";
    }

    text.textContent = `Level ${level}`;
    overlay.classList.remove("hidden");

    if (level > 1) {
        new Audio("assets/sounds/duck-em-up-level-complete.mp3").play();
    }

    setTimeout(() => {
        overlay.classList.add("hidden");
        if (level === 1 && missesEl) {
            delete missesEl.dataset._prevDisplay;
        }
        if (typeof cb === "function") cb();
    }, 1800);
}

function showGameCompleteAnnouncement() {
    const overlay = document.getElementById("game-complete-announcement");
    const scoreEl = document.getElementById("final-score");
    const playBtn = document.getElementById("game-complete-play");

    if (!overlay) {
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

    if (scoreEl) scoreEl.textContent = String(score);
    overlay.classList.remove("hidden");

    // Attach global click-to-reload while overlay is visible
    attachOverlayClickReload();

    try {
        const completeSfx = new Audio("assets/sounds/duck-em-up-game-over.mp3");
        completeSfx.play();
    } catch (_) {}

    if (playBtn) {
        const newBtn = playBtn.cloneNode(true);
        playBtn.parentNode.replaceChild(newBtn, playBtn);
        newBtn.addEventListener("click", () => window.location.reload());
    }
}

function showGameOverAnnouncement() {
    const overlay = document.getElementById("game-over-announcement");
    const restartBtn = document.getElementById("game-over-restart");
    if (!overlay) return;

    overlay.classList.remove("hidden");

    // Attach global click-to-reload while overlay is visible
    attachOverlayClickReload();

    try {
        const failSfx = new Audio("assets/sounds/duck-em-up-fail.mp3");
        failSfx.play();
    } catch (_) {}

    if (restartBtn) {
        const newBtn = restartBtn.cloneNode(true);
        restartBtn.parentNode.replaceChild(newBtn, restartBtn);
        newBtn.addEventListener("click", () => window.location.reload());
    }
}

/* -------------------------
   Utility visuals (dog popups)
   ------------------------- */
function addDog(duckCount) {
    const dogImage = document.createElement("img");
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

    const dogScoreSound = new Audio("assets/sounds/dog-score.mp3");
    dogScoreSound.play();

    setTimeout(function () {
        if (dogImage.parentElement) document.body.removeChild(dogImage);
    }, 3000);
}

function addDogLaugh() {
    const dogImage = document.createElement("img");
    dogImage.classList.add("dog-popup");
    dogImage.src = "assets/images/dog-laugh.gif";
    dogImage.width = 150;
    dogImage.height = 210;
    dogImage.draggable = false;
    dogImage.style.position = "fixed";
    dogImage.style.bottom = "0px";
    dogImage.style.left = "50%";
    document.body.appendChild(dogImage);

    const dogLaughSound = new Audio("assets/sounds/dog-laugh.mp3");
    dogLaughSound.play();

    setTimeout(function () {
        if (dogImage.parentElement) document.body.removeChild(dogImage);
    }, 3000);
}

/* -------------------------
   Round starter
   ------------------------- */
function startRound() {
    if (currentRound === 1) {
        showLevelAnnouncement(currentLevel, addDucks);
    } else {
        updateUI();
        addDucks();
    }
}

/* -------------------------
   Initialization & event handlers
   ------------------------- */
window.onload = function () {
    const missesEl = document.getElementById("misses");
    if (missesEl) missesEl.style.display = "none";

    setTimeout(startRound, 2000);
    setInterval(moveDucks, 1000 / 60);

    document.addEventListener("click", function (e) {
        if (!ducks || ducks.length === 0 || bullets <= 0) return;

        if (
            e.target &&
            e.target.classList &&
            e.target.classList.contains("duck")
        )
            return;

        const scoreboard = document.querySelector(".scoreboard");
        if (scoreboard && scoreboard.contains(e.target)) return;

        bullets = Math.max(0, bullets - 1);
        renderBullets();
        new Audio("assets/sounds/duck-shot.mp3").play();

        if (bullets === 0 && ducks && ducks.length > 0) {
            roundEndedWithLaugh = true;
            ducks.forEach((d) => {
                if (d.state === "flying") {
                    d.state = "flyingAway";
                    d.velocityY = -10;
                    d.velocityX = d.velocityX * 0.2;
                    missesThisLevel = (missesThisLevel || 0) + 1;
                }
            });
            updateUI();
            stopQuackLoop();
        }
    });
};

window.addEventListener("load", updateUI);
