const playBoard = document.querySelector(".play-board");

let foodX, foodY;
let snakeX = 5,
    snakeY = 10;
let snakeBody = [];
let velocityX = 0,
    velocityY = 0;

const changeFoodPosition = () => {
    // Passing a random 0 - 30 value as food position
    foodX = Math.floor(Math.random() * 32) + 1;
    foodY = Math.floor(Math.random() * 32) + 1;
};

const changeDirection = (e) => {
    if (e.key === "ArrowUp") {
        velocityX = 0;
        velocityY = -1;
    } else if (e.key === "ArrowDown") {
        velocityX = 0;
        velocityY = 1;
    } else if (e.key === "ArrowLeft") {
        velocityX = -1;
        velocityY = 0;
    } else if (e.key === "ArrowRight") {
        velocityX = 1;
        velocityY = 0;
    }
    initGame();
};

const initGame = () => {
    let htmlMarkup = `<div class="food" style="grid-area: ${foodY} / ${foodX}"></div>`;

    //food moves after being eaten by snake
    if (snakeX === foodX && snakeY === foodY) {
        changeFoodPosition();
        snakeBody.push([foodX, foodY]); //push food to snake body
        console.log(snakeBody);
    }

    for (let i = snakeBody.length - 1; i > 0; i--) {
        //shifting forward the values of the elements in the snake body by one
        snakeBody[i] = snakeBody[i - 1];
    }

    snakeBody[0] = [snakeX, snakeY]; //setting first element of snake body to current snake position

    //updating snake head position based on velocity
    snakeX += velocityX;
    snakeY += velocityY;

    //adding divs for each part of the snake body

    for (let i = 0; i < snakeBody.length; i++) {
        //adding a div for each part of the snake body
        htmlMarkup += `<div class="head" style="grid-area: ${snakeBody[i][1]} / ${snakeBody[i][0]}"></div>`;
    }

    playBoard.innerHTML = htmlMarkup;
};

changeFoodPosition();
setInterval(initGame, 125);
document.addEventListener("keydown", changeDirection);
