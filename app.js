//TYLER'S &&ROBERT'S GAME

//Doc
/*
1. Changed the progam from using objects to lists
*/

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
    // Remove dead players
    for (let id in playerList) {
        if (playerList[id].dead) {
            delete playerList[id];
        }
    }
    io.emit('update', { players: playerList, zombies: zombieList, bullets: bulletList });
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

app.get('/dead', isAuthed, (req, res) => {
    res.render('dead');
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

//SERVER GAME CODE STARTS HERE

//VARS
let playerList = [];
let zombieList = [];
let bulletList = [];

let mouseX = 0;
let mouseY = 0;

class Player {
    constructor(id, x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.id = id;
        this.color = `rgb(${Math.floor(Math.random() * 256)}, 0, ${Math.floor(Math.random() * 256)})`;
        this.keys = {};
        this.lastShot = 0;
        this.hp = 10; //normally 100
        this.dead = false;
        this.score = 0;
    }
}

class Zombie {
    constructor(id, x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.id = id;
        this.color = 'darkgreen';
        this.lastHit = 0;
    }
}

class Bullet {
    constructor(id, x, y, w, h, dx, dy) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.id = id;
        this.dx = dx;
        this.dy = dy;
        this.color = 'black';
    }
}

function spawnZombie() {
    const maxZombies = 10;

    if (zombieList.length >= maxZombies) return;
    const id = `zombie_${Date.now()}`;
    
    //Spawn zombie on the edge
    let x, y;
    const edge = Math.floor(Math.random() * 4);
    switch (edge) {
        //Top
        case 0:
            x = Math.random() * 1800;
            y = 0;
            break;
        //Bottom
        case 1:
            x = Math.random() * 1800;
            y = 800;
            break;
        //Left
        case 2: 
            x = 0;
            y = Math.random() * 800;
            break;
        //Right
        case 3: 
            x = 1800;
            y = Math.random() * 800;
            break;
    }

    zombieList.push(new Zombie(id, x, y, 50, 50));
}

function spawnBullet(playerId) {
    const id = `bullet_${Date.now()}`;
    let player = playerList.find(p => p.id === playerId); //p stands for player
    let x = player.x;
    let y = player.y;
    let dx = mouseX - x;
    let dy = mouseY - y;
    bulletList.push(new Bullet(id, x, y, 10, 10, dx, dy));
}

io.on('connection', (socket) => {
    //On player connection
    console.log(`User ${socket.id} connected.`);
    playerList.push(new Player(socket.id, 0, 0, 50, 50));

    socket.emit('init', { players: playerList, zombies: zombieList, bullets: bulletList });

    //Handle key inputs
    socket.on('keyDown', (key) => {
        let player = playerList.find(p => p.id === socket.id); //p stands for player
        if (player) {
            player.keys[key] = true;
        }
    });
    
    socket.on('keyUp', (key) => {
        let player = playerList.find(p => p.id === socket.id); //p stands for player
        if (player) {
            delete player.keys[key];
        }
    });
    //!!//

    //Handle mouse movement
    socket.on('mouse', (data) => {
        mouseX = data.x;
        mouseY = data.y;
    });

    //On disconnect
    socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected.`);
        playerList = playerList.filter(p => p.id !== socket.id); //p stands for player
        io.emit('update', { players: playerList, zombies: zombieList, bullets: bulletList });
    });

    //DAWG JUST WORK ALREADY
    socket.on('dead', () => {
        socket.emit('redirect', '/dead');
    });
});

function updatePlayerPositions() {
    const speed = 7;
    for (let player of playerList) {
        let shootCooldown = 250; //250ms

        //Move player
        //let player = playerList[id];
        if (player.keys['w']) player.y -= speed;
        if (player.keys['a']) player.x -= speed;
        if (player.keys['s']) player.y += speed;
        if (player.keys['d']) player.x += speed;

        //Shoot
        if (player.keys[' ']) {
            const now = Date.now();
            if (now - player.lastShot >= shootCooldown) {
                spawnBullet(player.id);
                player.lastShot = now;
            }
        }

        //Check if player is dead
        if (player.hp <= 0) {
            //No worky
            io.to(player.id).emit('dead');
            player.dead = true;
        }

        if (player.x < 0) player.x = 0;
        if (player.y < 0) player.y = 0;
        if (player.x > 1750) player.x = 1750;
        if (player.y > 750) player.y = 750;
    }
}

function updateZombie() {
    const speed = 5;

    for (let zombie of zombieList) {
        if (playerList.length == 0) continue;

        //Find closest player
        let closestPlayer = null;
        let closestDistance = Infinity;
        for (let player of playerList) {
            let distance = Math.sqrt((player.x - zombie.x) ** 2 + (player.y - zombie.y) ** 2);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPlayer = player;
            }
        }

        //Move zombie towards closest player
        if (closestPlayer) {
            let dx = closestPlayer.x - zombie.x;
            let dy = closestPlayer.y - zombie.y;
            let distance = Math.sqrt(dx ** 2 + dy ** 2);

            //Normalize direction
            let normX = dx / distance;
            let normY = dy / distance;

            //Move zombie
            zombie.x += normX * speed;
            zombie.y += normY * speed;

            //Hit Cooldown
            const hitCooldown = 1000;
            const now = Date.now();
            if (!zombie.lastHit || now - zombie.lastHit >= hitCooldown) {
                //Check for colision with player 
                if (checkCollision(zombie, closestPlayer)) {
                    closestPlayer.hp -= 10;
                    zombie.lastHit = now;
                }
            }
        }
    }
}

function updateBullet() {
    const speed = 15;
    for (let bullet of bulletList) {
        //If there are no players continue
        if (playerList.length == 0) continue;

        //Calculate direction towards mouse position
        let dx = bullet.dx;
        let dy = bullet.dy;
        let distance = Math.sqrt(dx ** 2 + dy ** 2);

        let normX = dx / distance;
        let normY = dy / distance;

        //Move bullet towards mouse position
        bullet.x += normX * speed;
        bullet.y += normY * speed;

        //Check for colision with zombies
        for (let zombie of zombieList) {
            if (checkCollision(bullet, zombie)) {
                //Remove bullet and zombie
                bulletList = bulletList.filter(b => b.id !== bullet.id); //b stands for bullet
                zombieList = zombieList.filter(z => z.id !== zombie.id); //z stands for zombie
                
                break;
            }
        }

        //Remove bullet if it goes out of canvas
        if (bullet.x < 0 || bullet.x > 1800 || bullet.y < 0 || bullet.y > 850) {
            bulletList = bulletList.filter(b => b.id !== bullet.id); //bulletList = bulletList's id
        }
    }
}

//One and only collision function
function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.w &&
        obj1.x + obj1.w > obj2.x &&
        obj1.y < obj2.y + obj2.h &&
        obj1.y + obj1.h > obj2.y;
}

//Spawn zombie
setInterval(spawnZombie, Math.random() * 3000 + 1000);

//Send updates to clients
setInterval(() => {
    io.emit('update', { players: playerList, zombies: zombieList, bullets: bulletList });
}, 1000 / 60);

//Update game
setInterval(updateGame, 1000 / 60);

function updateGame() {
    updatePlayerPositions();
    updateZombie();
    updateBullet();
}

//GAME CODE ENDS HERE

server.listen(PORT, () => {
    console.log(`Server started on port:${PORT}`);
});