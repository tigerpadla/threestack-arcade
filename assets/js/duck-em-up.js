window.addEventListener("load", function () {
    console.log("Duck 'Em Up: script loaded");

    // Create one duck image and place at random position
    const duck = document.createElement("img");
    duck.src = "assets/images/duck-right.gif"; // add actual file later
    duck.width = 96;
    duck.height = 93;
    duck.style.position = "absolute";
    duck.draggable = false;

    const gameWidth = window.innerWidth;
    const gameHeight = Math.floor((window.innerHeight * 3) / 4);

    function randomPosition(limit) {
        return Math.floor(Math.random() * Math.max(1, limit));
    }

    duck.style.left = randomPosition(gameWidth - duck.width) + "px";
    duck.style.top = randomPosition(gameHeight - duck.height) + "px";

    document.body.appendChild(duck);
});
