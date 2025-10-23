const playBoard = document.querySelector(".play-board");
const scoreElement = document.querySelector(".score");
const highScoreElement = document.querySelector(".high-score");
const controls = document.querySelectorAll(".controls i");
let snakeDirection = "left";

let gameOver = false;

let foodX, foodY;
let snakeX = 5,
    snakeY = 10;
let snakeBody = [];
let velocityX = 0,
    velocityY = 0;

let setIntervalId;

let score = 0;
//get high score from local storage
let highScore = localStorage.getItem("high-score") || 0;
highScoreElement.innerText = `High Score: ${highScore}`;

const changeFoodPosition = () => {
    // Passing a random 0 - 30 value as food position
    foodX = Math.floor(Math.random() * 32) + 1;
    foodY = Math.floor(Math.random() * 32) + 1;
};

const handleGameOver = () => {
    //clear timer and reload page on game over
    clearInterval(setIntervalId);
    alert("Game Over! Press OK to restart.");
    location.reload();
};

const changeDirection = (e) => {
    if (e.key === "ArrowUp" && velocityY !== 1) {
        velocityX = 0;
        velocityY = -1;
        snakeDirection = "up";
    } else if (e.key === "ArrowDown" && velocityY !== -1) {
        velocityX = 0;
        velocityY = 1;
        snakeDirection = "down";
    } else if (e.key === "ArrowLeft" && velocityX !== 1) {
        velocityX = -1;
        velocityY = 0;
        snakeDirection = "left";
    } else if (e.key === "ArrowRight" && velocityX !== -1) {
        velocityX = 1;
        velocityY = 0;
        snakeDirection = "right";
    }
    initGame();
};

const addDirectionClass = (direction) => {
    const head = document.querySelector(".head");
    head.classList.remove("up", "down", "right");
    head.classList.add(direction);
    const tail = document.querySelector(".snake-tail");
    if (!tail) return;
    tail.classList.remove("up", "down", "right");
    tail.classList.add(direction);

    const bodies = document.querySelectorAll(".snake-body");
    if (bodies.length === 0) return;
    bodies.forEach((body) => {
        body.classList.remove("up", "down", "right");
        body.classList.add(direction);
    });
};

controls.forEach((key) => {
    //adding click event for touch controls
    key.addEventListener("click", () =>
        changeDirection({ key: key.dataset.key })
    );
});

const initGame = () => {
    if (gameOver) return handleGameOver();
    let htmlMarkup = `<div class="food" style="grid-area: ${foodY} / ${foodX}"></div>`;

    //food moves after being eaten by snake
    if (snakeX === foodX && snakeY === foodY) {
        changeFoodPosition();
        snakeBody.push([foodX, foodY]); //push food to snake body
        score++; //increment score +1

        highScore = score >= highScore ? score : highScore;
        localStorage.setItem("high-score", highScore);
        scoreElement.innerText = `Score: ${score}`;
        highScoreElement.innerText = `High Score: ${highScore}`;
    }

    for (let i = snakeBody.length - 1; i > 0; i--) {
        //shifting forward the values of the elements in the snake body by one
        snakeBody[i] = snakeBody[i - 1];
    }

    snakeBody[0] = [snakeX, snakeY]; //setting first element of snake body to current snake position

    //updating snake head position based on velocity
    snakeX += velocityX;
    snakeY += velocityY;

    //check if snake head hits wall, if true game over
    if (snakeX <= 0 || snakeX > 32 || snakeY <= 0 || snakeY > 32) {
        gameOver = true;
    }

    //adding divs for each part of the snake body

    for (let i = 0; i < snakeBody.length; i++) {
        //adding a div for each part of the snake body
        if (i == 0) {
            htmlMarkup += `<div class="head" style="grid-area: ${snakeBody[i][1]} / ${snakeBody[i][0]}"></div>`;
        } else if (i == snakeBody.length - 1) {
            htmlMarkup += `<div class="snake-tail" style="grid-area: ${snakeBody[i][1]} / ${snakeBody[i][0]}"></div>`;
        } else {
            htmlMarkup += `<div class="snake-body" style="grid-area: ${snakeBody[i][1]} / ${snakeBody[i][0]}"></div>`;
        }

        //check if snake head hits body, if true game over
        if (
            i !== 0 &&
            snakeBody[0][1] === snakeBody[i][1] &&
            snakeBody[0][0] === snakeBody[i][0]
        ) {
            gameOver = true;
        }
    }

    playBoard.innerHTML = htmlMarkup;
    addDirectionClass(snakeDirection);
};

changeFoodPosition();
setIntervalId = setInterval(initGame, 125);
document.addEventListener("keydown", changeDirection);

// snakeBody = [[5, 10], [6, 10], [7, 10], [8, 10], [9, 10], [10, 10]]
