const socket = io();

//Vars
let playerList = {};
let playerId = null;

let zombieList = {};
let zombieId = null;

let bulletList = {};
let bulletId = null;

let keys = {};

let mouseX = 0;
let mouseY = 0;

//Sockets
socket.on('init', (players, zombies, bullets) => {
    //Init playerList
    playerList = players;
    playerId = socket.id;

    zombieList = zombies;
    zombieId = `zombie_${Date.now()}`;

    bulletList = bullets;
    bulletId = `bullet_${Date.now()}`;
    update();
});

socket.on('update', (data) => {
    //Update playerList
    playerList = data.players;

    zombieList = data.zombies;

    bulletList = data.bullets;
    update();
});

//Event
document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd', ' '].includes(key)) {
        //Send server the key inputs
        keys[key] = true;
        // console.log(keys);
        socket.emit('keyDown', key);
    }
});

document.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd', ' '].includes(key)) {
        //Send server the key inputs
        keys[key] = false;
        socket.emit('keyUp', key);
    }
});

//Mouse tracking
document.addEventListener('mousemove', event => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    // console.log(mouseX, mouseY);

    //Send server the mouse position
    socket.emit('mouse', { x: mouseX, y: mouseY });
});

//GAME LOOPS
function update() {
    //Canvas
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1800;
    canvas.height = 800;

    //Canvas color
    ctx.fillStyle = '#19b543';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //Draw players
    for (let id in playerList) {
        const player = playerList[id];
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.w, player.h);
    }

    //Draw zombies
    for (let id in zombieList) {
        const zombie = zombieList[id];
        ctx.fillStyle = zombie.color;
        ctx.fillRect(zombie.x, zombie.y, zombie.w, zombie.h);
    }
    // console.log(zombieList);

    //Draw bullets
    for (let id in bulletList) {
        const bullet = bulletList[id];
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.w, bullet.h);
    }

    requestAnimationFrame(update);
}

window.onload = () => {
    //Create canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    document.body.appendChild(canvas);
    update();
}