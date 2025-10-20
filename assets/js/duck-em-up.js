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

window.onload = function () {
    // addDucks();
    setTimeout(addDucks, 2000); // Wait 2 seconds
    setInterval(moveDucks, 1000 / 60); // 60 frames per second
};

function addDucks() {
    ducks = [];
    duckCount = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < duckCount; i++) {
        let duckImageName = duckImageNames[Math.floor(Math.random() * 2)];
        let duckImage = document.createElement("img");
        duckImage.src = duckImageName;
        duckImage.width = duckWidth;
        duckImage.height = duckHeight;
        duckImage.draggable = false;
        duckImage.style.position = "absolute";
        duckImage.dataset.state = "flying";

        duckImage.onclick = function () {
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

            this.dataset.state = "shot";
            duckEntry.state = "shot";
            duckEntry.velocityX = 0;
            duckEntry.velocityY = 0;

            let duckShotSound = new Audio("assets/sounds/duck-shot.mp3");
            duckShotSound.play();
            score += 1;
            document.getElementById("score").innerHTML = score;

            const originalSrc = this.src;
            this.classList.add("duck-shot-image");
            this.src = "assets/images/duck-shot.png";

            setTimeout(() => {
                if (!duckEntry.image.parentElement) {
                    return;
                }
                this.classList.remove("duck-shot-image");
                this.src = "assets/images/duck-fall.gif";
                this.dataset.state = "falling";

                duckEntry.state = "falling";
                duckEntry.fallVelocity = 6;
                duckEntry.maxFallVelocity = 20;
                duckEntry.gravity = 0.9;
            }, 1000);
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
        };
        duck.image.style.left = String(duck.x) + "px"; // X position
        duck.image.style.top = String(duck.y) + "px"; // Y position

        if (duck.image.src.includes(duckImageNames[0])) {
            duck.velocityX = -duckVelocityX; // Going left
        }
        ducks.push(duck);
    }
}

function moveDucks() {
    for (let i = ducks.length - 1; i >= 0; i--) {
        let duck = ducks[i];

        if (duck.state === "shot") {
            continue;
        }

        if (duck.state === "falling") {
            duck.fallVelocity = Math.min(
                (duck.fallVelocity || 0) + (duck.gravity || 0),
                duck.maxFallVelocity || 20
            );
            duck.y += duck.fallVelocity;

            if (duck.y >= gameHeight - duckHeight) {
                duck.y = gameHeight - duckHeight;
                duck.image.style.top = `${duck.y}px`;

                if (duck.image.parentElement) {
                    duck.image.parentElement.removeChild(duck.image);
                }
                ducks.splice(i, 1);

                if (ducks.length === 0) {
                    addDog(duckCount);
                }
                continue;
            }

            duck.image.style.top = `${duck.y}px`;
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
    }, 5000); // 5000ms = 5 seconds
}

function randomPosition(limit) {
    return Math.floor(Math.random() * limit);
}
