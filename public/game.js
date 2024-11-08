const socket = io();

//Vars
let playerList = {};
let playerId = null;
let bulletList = {};
let keys = {};

//Sockets
socket.on('init', (players) => {
    //Init playerList
    playerList = players;
    playerId = socket.id;
    update();
});

socket.on('update', (players) => {
    //Update playerList
    playerList = players;
    update();
});

socket.on('zombieinit', (zombies) => {
    //Update zombieList
    zombieList = zombies;
    update();
});

socket.on('bullet', (bullet) => {
    //Create a bullet
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(bullet.x, bullet.y, bullet.w, bullet.h);
});

//Event
document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(key)) {
        //Send server the key inputs
        keys[key] = true;
        socket.emit('keyDown', key);
    }

    if (key === ' ') {
        //Send server the key inputs
        socket.emit('shoot', key);
    }
});

document.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(key)) {
        //Send server the key inputs
        socket.emit('keyUp', key);
    }
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

    //Draw zombies
    for (let id in zombieList) {
        const zombie = zombieList[id];
        ctx.fillStyle = 'darkgreen';
        ctx.fillRect(zombie.x, zombie.y, zombie.w, zombie.h);
    }

    //Draw players
    for (let id in playerList) {
        const player = playerList[id];
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.w, player.h);
    }

    requestAnimationFrame(update);
}

window.onload = () => {
    //Create canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    document.body.appendChild(canvas);
    update();
};