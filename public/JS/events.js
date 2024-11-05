let a = false;
let d = false;
let w = false;
let s = false;
let shoot = false;

let bullets = [];
let zombies = [];

const negv = -3;
const posv = 3;

//Mouse Variables
let mouseX = 0;
let mouseY = 0;

//CoolDown Variables
const coolDown = 250;
let lastShot = Date.now();

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

//Key Events
document.addEventListener('keydown', event => {
    if (event.key == 'w'.toLowerCase()) {
        w = true;
    }
    if (event.key == 'a'.toLowerCase()) {
        a = true;
    }
    if (event.key == 's'.toLowerCase()) {
        s = true;
    }
    if (event.key == 'd'.toLowerCase()) {
        d = true;
    }
});

document.addEventListener('keyup', event => {
    if (event.key === 'w'.toLowerCase()) {
        w = false;
    }
    if (event.key === 'a'.toLowerCase()) {
        a = false;
    }
    if (event.key === 's'.toLowerCase()) {
        s = false;
    }
    if (event.key === 'd'.toLowerCase()) {
        d = false;
    }
});

//Mouse tracking
window.addEventListener('mousemove', event => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    //console.log(mouseX, mouseY);
});

//Mouse shoot
window.addEventListener('mousedown', event => {
    shoot = true;
});
window.addEventListener('mouseup', event => {
    shoot = false;
});

//CanShoot function
function canShoot() {
    const notOver = Date.now() - lastShot > coolDown;
    if (notOver) {
        return true;
    }
}

//Move function
function move() {
    if (w) {
        player.yv = negv;
    }
    if (a) {
        player.xv = negv;
    }
    if (s) {
        player.yv = posv;
    }
    if (d) {
        player.xv = posv;
    }

    if (!w && !s) {
        player.yv = 0;
    }
    if (!a && !d) {
        player.xv = 0;
    }
}

//Bullet Spawn Function
function spawnBullet() {
    if (shoot && canShoot()) {
        let bullet = new Bullet(player.x + (player.h / 2), player.y + (player.w / 2), mouseX, mouseY);
        bullets.push(bullet);
        lastShot = Date.now();
    }
}

//Zombie spawn
function spawnZombie() {
    if (randomInt(0,100) == 9) {
        var zombie = new Zombie(100, 100, 'red');
        zombies.push(zombie);
    }
}

//Update function
function eventUpdate() {
    move();
    spawnBullet();
    spawnZombie();
}