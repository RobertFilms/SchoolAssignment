//TYLER AND ROBERT'S PROJECT FOR CLASS

//Base node stuff frfr
const sql = require('sqlite3');
const express = require('express');
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');

const PORT = 3000;

const app = express();

const { createServer } = require('node:http');
const { join } = require('node:path');

const { Server } = require('socket.io');
const { disconnect } = require('process');
const server = createServer(app);
const io = new Server(server);

//Thank goodness for the login boilerplate we made in calss
//Being insane is trying to do the same thing over and over again and expecting different results - Albert Einstein

//Add a thing to add an image to the user profile (maybe)
//And I should prob make a ejs page to display profiles
//Add a chat feature
//Make the classes and important stuff server side to make it harder to cheat

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use('/public', express.static(path.join(__dirname, 'public')));

//Session stuff
app.use(session({
    secret: 'LookAtMeImTheSecretNow',
    resave: false,
    saveUninitialized: false
}));

//Functions
function isAuthed(req, res, next) {
    if (req.session.user) next();
    else res.redirect('/login');
}

io.on('connection', (socket) => {
    console.log('New user connected.');
    socket.on('disconnect', () => {
        console.log('A user has disconnected.');
    });
});

//App gets
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

//App posts
app.post('/login', (req, res) => {
    if (req.body.username && req.body.password) {
        db.get('SELECT * FROM users WHERE username = ?; ', req.body.username, (err, row) => {
            if (err) res.redirect('/login', { message: 'An error occured' });
            else if (!row) {
                //Create a new salt for this user
                const SALT = crypto.randomBytes(16).toString('hex');

                //use salt to 'hash' the password
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
                //Compare your password with stored password

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

//Vars
let userList = [];
let playerList = [];

//Canvas
const X = 800; W = 800; H = 600; Y = 600;


class Player {
    constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
    }

    draw() {
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x, this.y, this.w, this.h);
    }

    update() {
        if (this.x < 0) {
            this.x = 0;
        }
        if (this.x + this.w > canvas.width) {
            this.x = canvas.width - this.w;
        }
        if (this.y < 0) {
            this.y = 0;
        }
        if (this.y + this.h > canvas.height) {
            this.y = canvas.height - this.h;
        }
    }
}



//GAME CODE ENDS HERE

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});