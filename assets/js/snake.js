const playBoard = document.querySelector(".play-board");
const scoreElement = document.querySelector(".score");

let gameOver = false;

let foodX, foodY;
let snakeX = 5,
    snakeY = 10;
let snakeBody = [];
let velocityX = 0,
    velocityY = 0;

let setIntervalId;

let score = 0;

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
    } else if (e.key === "ArrowDown" && velocityY !== -1) {
        velocityX = 0;
        velocityY = 1;
    } else if (e.key === "ArrowLeft" && velocityX !== 1) {
        velocityX = -1;
        velocityY = 0;
    } else if (e.key === "ArrowRight" && velocityX !== -1) {
        velocityX = 1;
        velocityY = 0;
    }
    initGame();
};

const initGame = () => {
    if (gameOver) return handleGameOver();
    let htmlMarkup = `<div class="food" style="grid-area: ${foodY} / ${foodX}"></div>`;

    //food moves after being eaten by snake
    if (snakeX === foodX && snakeY === foodY) {
        changeFoodPosition();
        snakeBody.push([foodX, foodY]); //push food to snake body
        score++; //increment score +1

        scoreElement.innerText = `Score: ${score}`;
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
        htmlMarkup += `<div class="head" style="grid-area: ${snakeBody[i][1]} / ${snakeBody[i][0]}"></div>`;

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
};

changeFoodPosition();
setIntervalId = setInterval(initGame, 125);
document.addEventListener("keydown", changeDirection);
