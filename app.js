//TYLERS'S AND ROBERT'S GAME

//SO MUCH CONSTS
const express = require('express');
const app = express();
const path = require('path');
const { join } = require('path');
const sql = require('sqlite3');
const session = require('express-session');
const crypto = require('crypto');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server);

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'LookAtMeImTheSecretNow',
    resave: false,
    saveUninitialized: false
}));

function isAuthed(req, res, next) {
    if (req.session.user) next();
    else res.redirect('/login');
}

app.get('/', isAuthed, (req, res) => {
    res.render(join('index'));
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/game', isAuthed, (req, res) => {
    res.render('game');
});

app.get('/profile', isAuthed, (req, res) => {
    db.get('SELECT * FROM users WHERE username = ?;', req.session.user, (err, row) => {
        if (err) res.send('An error occured:\n' + err);
        else {
            res.render('profile', { user: row });
        }
    });
});

app.post('/login', (req, res) => {
    if (req.body.username && req.body.password) {
        db.get('SELECT * FROM users WHERE username = ?; ', req.body.username, (err, row) => {
            if (err) res.redirect('/login', { message: 'An error occured' });
            else if (!row) {
                const SALT = crypto.randomBytes(16).toString('hex');
                crypto.pbkdf2(req.body.password, SALT, 1000, 64, 'sha512', (err, derivedKey) => {
                    if (err) res.redirect('/login');
                    else {
                        const hashPassword = derivedKey.toString('hex');
                        db.run('INSERT INTO users (username, password, salt) VALUES (?, ?, ?);', [req.body.username, hashPassword, SALT], (err) => {
                            if (err) res.send('An error occured:\n' + err);
                            else {
                                res.redirect('/login');
                            };
                        });
                    }
                });
            } else {
                crypto.pbkdf2(req.body.password, row.salt, 1000, 64, 'sha512', (err, derivedKey) => {
                    if (err) res.redirect('/login');
                    else {
                        const hashPassword = derivedKey.toString('hex');
                        if (hashPassword === row.password) {
                            req.session.user = req.body.username;
                            res.redirect('/');
                        } else res.redirect('/login');
                    }
                });
            }
        });
    }
});

const db = new sql.Database('data/userData.db', (err) => {
    if (err) {
        console.error(err);
    } else {
        console.log('Opened database');
    }
});

//GAME CODE STARTS HERE

//VARS
let playerList = {};
let zombieList = {};
let bulletList = {};

class Player {
    constructor(id, x, y, w, h) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = `rgb(${Math.floor(Math.random() * 256)}, 0, ${Math.floor(Math.random() * 256)})`;
        this.keys = {};
    }
}

class Zombie {
    constructor(id, x, y, w, h) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = 'darkgreen';
    }
}

class Bullet {
    constructor(id, x, y, w, h, dx, dy) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.dx = dx;
        this.dy = dy;
        this.color = 'black';
    }
}

function spawnZombie() {
    const id = `zombie_${Date.now()}`;
    let x = Math.random() * 1800;
    let y = Math.random() * 800;
    zombieList[id] = new Zombie(id, x, y, 50, 50);
}

io.on('connection', (socket) => {
    console.log(`User ${socket.id} connected.`);
    playerList[socket.id] = new Player(socket.id, 0, 0, 50, 50);

    //Send player list and zombie list to new player
    socket.emit('init', { players: playerList, zombies: zombieList });

    //Handle key presses
    socket.on('keyDown', (key) => {
        playerList[socket.id].keys[key] = true;
    });

    socket.on('keyUp', (key) => {
        delete playerList[socket.id].keys[key];
    });

    socket.on('shoot', () => {

    });

    //When a player disconnects
    socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected.`);
        delete playerList[socket.id];
        //Update all players
        io.emit('update', { players: playerList, zombies: zombieList });
    });
});

function updatePlayerPositions() {
    const speed = 7;
    for (let id in playerList) {
        //Move player
        let player = playerList[id];
        //Move player
        if (player.keys['w']) player.y -= speed;
        if (player.keys['a']) player.x -= speed;
        if (player.keys['s']) player.y += speed;
        if (player.keys['d']) player.x += speed;

        //Keep player in canvas
        if (player.x < 0) player.x = 0;
        if (player.y < 0) player.y = 0;
        if (player.x + player.w > 1800) player.x = 1800 - player.w;
        if (player.y + player.h > 800) player.y = 800 - player.h;
    }
    //Update all players
    io.emit('update', { players: playerList, zombies: zombieList });
}

function updateZombie() {
    const speed = 4;
    for (let id in zombieList) {
        let zombie = zombieList[id];
        //Check if there are any players
        if (Object.keys(playerList).length == 0) continue;

        //Find the closest player
        let closestPlayer = null;
        let closestDistance = Infinity;
        for (let playerId in playerList) {
            let player = playerList[playerId];
            let distance = Math.sqrt((player.x - zombie.x) ** 2 + (player.y - zombie.y) ** 2);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPlayer = player;
            }
        }

        //Move zombie towards the closest player
        if (closestPlayer) {
            let dx = closestPlayer.x - zombie.x;
            let dy = closestPlayer.y - zombie.y;
            let distance = Math.sqrt(dx ** 2 + dy ** 2);

            let normX = dx / distance;
            let normY = dy / distance;

            //Make the zombie move
            zombie.x += normX * speed;
            zombie.y += normY * speed;
        }
    }
    // Update all players
    io.emit('update', { players: playerList, zombies: zombieList });
}

//Spawn zombie every 5 seconds
setInterval(spawnZombie, 5000);

//Update positions at 60fps
setInterval(updateGame, 1000 / 60);

function updateGame() {
    updatePlayerPositions();
    updateZombie();

    // console.log(zombieList);
    // console.log(playerList);
}

//GAME CODE ENDS HERE

server.listen(PORT, () => {
    console.log(`Server started on port:${PORT}`);
});