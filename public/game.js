//CLIENT SIDE CODE
const socket = io();

//Canvas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1800;
canvas.height = 800;

//Vars
let playerList = [];
let playerId = null;

let zombieList = [];
let zombieId = null;

let bulletList = [];
let bulletId = null;

let playerScore = 1;

let scoreDisplay = document.getElementById('score');

let keys = {};

let mouseX = 0;
let mouseY = 0;

let deadPage = '/dead';

const lerp = (a, b, t) => a + (b - a) * t;

//Sockets
socket.on('init', (data) => {
    //Init playerList
    playerList = data.players;
    playerId = socket.id;
    playerScore = playerList.find(player => player.id === playerId).score;

    zombieList = data.zombies;
    zombieId = `zombie_${Date.now()}`;

    bulletList = data.bullets;
    bulletId = `bullet_${Date.now()}`;
});

socket.on('update', (data) => {
    //Update playerList
    playerList = data.players; //Get all players

    // Update the player's score
    const player = playerList.find(player => player.id === playerId);
    if (player) {
        playerScore = player.score;
    }

    zombieList = data.zombies; //Get all zombies

    bulletList = data.bullets; //Get all bullets
    
    if (document.getElementById('gameCanvas')) {
        update();
    }
});

socket.on('dead', (deadPage) => {
    window.location.href = deadPage;
})

//Event
document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd', ' '].includes(key)) {
        //Send server the key inputs
        keys[key] = true;
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

    //Send server the mouse position
    socket.emit('mouse', { x: mouseX, y: mouseY });
});

let x = 0;
let y = 0;

//GAME LOOPS
function update() {

    //Canvas color
    ctx.fillStyle = '#19b543';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    //Testing lerp
    // ctx.fillStyle = 'red';
    // x = lerp(x, mouseX, 0.01);
    // y = lerp(y, mouseY, 0.01);
    // ctx.fillRect(x, y, 50, 50);

    //Draw score
    ctx.fillStyle = 'black';
    ctx.font = '30px Arial';
    scoreDisplay.innerHTML = `Score: ${playerScore}`;

    //Draw players
    for (let player of playerList) {
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.w, player.h);
    }

    //Draw zombies
    for (let zombie of zombieList) {
        ctx.fillStyle = zombie.color;
        ctx.fillRect(zombie.x, zombie.y, zombie.w, zombie.h);
    }

    //Draw bullets
    for (let bullet of bulletList) {
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
    socket.emit('requestInit');
}
