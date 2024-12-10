const express = require('express');
const app = express();
const sql = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');
const http = require('http');
const { Server } = require('socket.io');
const { time } = require('console');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server);

app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

function isAuthed(req, res, next) {
    if (req.session.user) next();
    else res.redirect('/login');
}

app.get('/', isAuthed, (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/general', isAuthed, (req, res) => {
    const name = req.session.user;
    res.render('general', { name });
});

app.post('/login', (req, res) => {
    if (req.body.username && req.body.password) {
        db.get(`SELECT * FROM users WHERE username = ?; `, req.body.username, (err, row) => {
            if (err) {
                res.send('An error occurred:\n' + err);
            } else if (!row) {
                //Create a new salt for this user
                const SALT = crypto.randomBytes(16).toString('hex');

                //Use salt to 'hash' password
                crypto.pbkdf2(req.body.password, SALT, 1000, 64, 'sha512', (err, derivedKey) => {
                    if (err) {
                        res.send('An error occurred:\n' + err);
                    } else {
                        const hashPassword = derivedKey.toString('hex');
                        db.run('INSERT INTO users (username, password, salt) VALUES (?, ?, ?);', [req.body.username, hashPassword, SALT], (err) => {
                            if (err) {
                                res.send('An error occurred:\n' + err);
                            } else {
                                res.send('new user created');
                            }
                        });
                    }
                });

            } else {
                //Compare your password with provided password
        
                crypto.pbkdf2(req.body.password, row.salt, 1000, 64, 'sha512', (err, derivedKey) => {
                    if (err) {
                        res.send('An error occurred:\n' + err);
                    } else {
                        const hashPassword = derivedKey.toString('hex');

                        if (hashPassword === row.password) {
                            req.session.user = req.body.username;

                            res.redirect('/general');
                        } else {
                            res.send('Invalid username or password');
                        }
                    }
                });
            }
        });
    } else {
        res.send('Invalid username or password');
    }
});

const db = new sql.Database('data/userData.db', (err) => {
    if (err) {
        console.error(err);
    } else {
        console.log('Opened database');
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});

let users = [];

io.on('connection', (socket) => {
    console.log(`User ${socket.id} connected.`);

    socket.on('join', (data) => {
        users.push({ name: data.name });
        io.emit('users', users);
        io.emit('message', { name: 'Server', text: `${data.name} has joined the chat. Say hello!`, time: new Date().toLocaleTimeString() });
    });

    socket.on('data', (data) => {
        io.emit('message', { text: data.text });
    });

    socket.on('message', (data) => {
        io.emit('message', { text: data.text, name: data.name, time: data.time });
    });

    socket.on('disconnect', () => {
        console.log(`User ${socket.id} disconnected.`);
    });
});