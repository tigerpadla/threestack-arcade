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

window.onload = function () {
    // addDucks();
    setTimeout(addDucks, 2000); // Wait 2 seconds
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
                }
            });
            stopQuackLoop();
        }
    });
};

function addDucks() {
    ducks = [];
    duckCount = Math.floor(Math.random() * 3) + 1;

    // bullets = duckCount + 1
    bullets = duckCount + 1;
    // reset round flag when starting a new round
    roundEndedWithLaugh = false;
    renderBullets();

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
                });
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
                    stopQuackLoop();
                    // respect roundEndedWithLaugh: show laughing dog if bullets ran out,
                    // otherwise show normal dog popup
                    if (roundEndedWithLaugh) {
                        addDogLaugh();
                        roundEndedWithLaugh = false;
                    } else {
                        addDog(duckCount);
                    }
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
                if (duck.image.parentElement) {
                    duck.image.parentElement.removeChild(duck.image);
                }
                ducks.splice(i, 1);

                // when last duck removed decide which popup to show
                if (ducks.length === 0) {
                    if (roundEndedWithLaugh) {
                        stopQuackLoop();
                        addDogLaugh();
                        roundEndedWithLaugh = false;
                    } else {
                        stopQuackLoop();
                        addDog(duckCount);
                    }
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

    dogImage.style.position = "fixed"; // Stay in same place even when scrolling
    dogImage.style.bottom = "0px"; // Bottom side of image 0px from bottom of page
    dogImage.style.left = "50%"; // Left side of image 50% screen width from left side of page
    document.body.appendChild(dogImage);

    let dogScoreSound = new Audio("assets/sounds/dog-score.mp3");
    dogScoreSound.play();

    setTimeout(function () {
        document.body.removeChild(dogImage);
        addDucks();
    }, 3000);
}

// special laughing dog when bullets run out
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
        document.body.removeChild(dogImage);
        addDucks();
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
