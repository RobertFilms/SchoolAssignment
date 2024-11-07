const socket = io();

let playerList = {};
let playerId = null;

socket.on('init', (players) => {
    playerList = players;
    playerId = socket.id;
    drawPlayers();
});

socket.on('update', (players) => {
    playerList = players;
    drawPlayers();
});

document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['w', 'a', 's', 'd'].includes(key)) {
        socket.emit('move', key);
    }
});

function drawPlayers() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let id in playerList) {
        const player = playerList[id];
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.w, player.h);
    }
}

window.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
};