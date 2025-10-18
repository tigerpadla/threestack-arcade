window.addEventListener('load', function () {
    console.log("Duck 'Em Up: script loaded");

    const duck = document.createElement('img');
    duck.src = 'assets/images/duck-right.gif';
    duck.width = 96;
    duck.height = 93;
    duck.style.position = 'absolute';
    duck.draggable = false;

    const gameWidth = window.innerWidth;
    const gameHeight = Math.floor((window.innerHeight * 3) / 4);

    function randomPosition(limit) {
        return Math.floor(Math.random() * Math.max(1, limit));
    }

    let x = randomPosition(gameWidth - duck.width);
    let y = randomPosition(gameHeight - duck.height);
    let velocityX = 4;
    let velocityY = 3;
    let score = 0;

    duck.style.left = x + 'px';
    duck.style.top = y + 'px';
    document.body.appendChild(duck);

    duck.addEventListener('click', function () {
        // play sound file when added
        const s = new Audio('assets/sounds/duck-shot.mp3');
        s.play().catch(() => {});
        score += 1;
        const scoreEl = document.getElementById('score');
        if (scoreEl) scoreEl.textContent = String(score);
        // remove duck
        document.body.removeChild(duck);
    });

    function loop() {
        x += velocityX;
        y += velocityY;

        if (x < 0 || x + duck.width > gameWidth) {
            velocityX *= -1;
            duck.src = velocityX < 0 ? 'assets/images/duck-left.gif' : 'assets/images/duck-right.gif';
        }
        if (y < 0 || y + duck.height > gameHeight) {
            velocityY *= -1;
        }

        duck.style.left = x + 'px';
        duck.style.top = y + 'px';
        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
});
