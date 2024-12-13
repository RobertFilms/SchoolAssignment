const express = require('express');
const app = express();
const sql = require('sqlite3').verbose();
const path = require('path');
const session = require('express-session');
const crypto = require('crypto');
const http = require('http');
const { Server } = require('socket.io');

const redis = require('redis');
const client = redis.createClient();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server);

app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/partials', express.static(path.join(__dirname, 'partials')));
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

app.get('/conv', isAuthed, (req, res) => {
    const user = req.session.user;
    res.render('conv', { user });
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
                                res.send('<script>alert("User created successfully!"); window.location.href = "/login";</script>');
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
                            res.redirect('/conv');
                        } else {
                            res.send('<script>alert("Invalid username or password"); window.location.href = "/login";</script>');
                        }
                    }
                });
            }
        });
    } else {
        res.send('<script>alert("Invalid username or password"); window.location.href = "/login";</script>');
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
    let users = [];

    //Horrendous lookin code
    io.on('connection', (socket) => {
        console.log('User connected.');

        socket.on('user_connected', (username) => {
            users.push({ name: username, id: socket.id });
            io.emit('users', users);
            console.log(`User ${username} connected.`);
        });

        socket.on('joinRoom', (data) => {
            socket.join(data.room);
            socket.room = data.room;
            io.to(data.room).emit('message', { user: 'SERVER', message: `${data.user} has joined the room ${data.room}.`, time: new Date().toLocaleTimeString(), room: data.room });
            console.log(`User ${data.user} joined room ${data.room}.`);
        });

        socket.on('leaveRoom', (data) => {
            socket.leave(data.room);
            io.to(data.room).emit('message', { user: 'SERVER', message: `${data.user} has left the room ${data.room}.`, time: new Date().toLocaleTimeString(), room: data.room });
            console.log(`User ${data.user} left room ${data.room}.`);
        });

        socket.on('message', (data) => {
            io.to(data.room).emit('message', { user: data.user, message: data.message, time: data.time, room: data.room });
            console.log(`Message from ${data.user} in room ${data.room}: ${data.message}`);
        });

        socket.on('get_room_users', (data) => {
            const roomUsers = users.filter(user => io.sockets.sockets.get(user.id).rooms.has(data.room)).map(user => user.name);
            socket.emit('roomUsers', { room: data.room, users: roomUsers });
            console.log(`Users in room ${data.room}: ${roomUsers.join(', ')}`);
        });

        socket.on('disconnect', () => {
            users = users.filter(user => user.id !== socket.id);
            io.emit('users', users);
            console.log('User disconnected.');
        });
    });
});
