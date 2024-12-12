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
    const name = req.session.user;
    res.render('conv', { name });
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
});

let users = [];

io.on('connection', (socket) => {
    console.log(`User connected.`);

    socket.on('join', (data) => {
        users.push({ name: data.name, id: socket.id });
        io.emit('users', users);
        io.emit('message', { name: 'SERVER', text: `${data.name} has joined the chat. Say hello!`, time: new Date().toLocaleTimeString() });
    });

    socket.on('data', (data) => {
        io.emit('message', { text: data.text });
    });

    socket.on('message', (data) => {
        io.emit('message', { text: data.text, name: data.name, time: data.time });
    });

    socket.on('command', (data) => {
        if (data.text.startsWith('/')) {
            const commandParts = data.text.replace('/', '').split(' ');
            const command = commandParts[0];
            const args = commandParts.slice(1);

            switch (command) {
                case 'users':
                    socket.emit('message', { text: `Users in chat: ${users.map(user => user.name).join(', ')}`, name: 'SERVER', time: new Date().toLocaleTimeString() });
                    break;
                case 'help':
                    socket.emit('message', { text: 'Commands: /help, /users, /join, /leave', name: 'SERVER', time: new Date().toLocaleTimeString() });
                    break;
                case 'join':
                    if (args.length > 0) {
                        const roomName = args[0];
                        socket.join(roomName);
                        socket.emit('message', { text: `You have joined room: ${roomName}`, name: 'SERVER', time: new Date().toLocaleTimeString() });
                        io.to(roomName).emit('message', { text: `${data.name} has joined the room ${roomName}.`, name: 'SERVER', time: new Date().toLocaleTimeString() });
                    } else {
                        socket.emit('message', { text: `Room name is required to join a room.`, name: 'SERVER', time: new Date().toLocaleTimeString() });
                    }
                    break;
                case 'leave':
                    if (args.length > 0) {
                        const roomName = args[0];
                        socket.leave(roomName);
                        socket.emit('message', { text: `You have left room: ${roomName}`, name: 'SERVER', time: new Date().toLocaleTimeString() });
                        io.to(roomName).emit('message', { text: `${data.name} has left the room.`, name: 'SERVER', time: new Date().toLocaleTimeString() });
                    } else {
                        socket.emit('message', { text: `Room name is required to leave a room.`, name: 'SERVER', time: new Date().toLocaleTimeString() });
                    }
                    break;
                default:
                    socket.emit('message', { text: `Command '${command}' not found. Type /help for a list of commands.`, name: 'SERVER', time: new Date().toLocaleTimeString() });
                    break;
            }
            console.log(`User ${data.name} sent a command: '${command}'`);
        }
    });

    socket.on('disconnect', () => {
        users = users.filter(user => user.id !== socket.id);
        console.log(`User disconnected.`);
    });
});