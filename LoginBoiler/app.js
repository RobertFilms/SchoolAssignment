const express = require('express');
const app = express();
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const pathjoin = require('path').join;

//Custom modules
const route = require('./modules/route');
const socket = require('./modules/socket');

//GIVE A FELLA A BREAK!
const PORT = 3000;

const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const io = require('socket.io')(server);
const { idkMan } = require('./modules/socket');

//App setup
app.set('view engine', 'ejs');
app.use(express.static(pathjoin(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: 'ThisIsTopMilitarySecret',
    resave: false,
    saveUninitialized: false
}))

//HOW MUCH MORE CAN I TAKE?
const sessionMiddleware = session({
    store: new SQLiteStore,
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }//Set true if using skibidi https
})

app.use(sessionMiddleware);

//I'M AT MY LIMIT!
io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, next);
});

//I CAN'T TAKE IT ANYMORE!
app.get('/', route.index);
app.get('/login', route.loginGet);
app.post('/login', route.loginPost);
app.get('/chat', route.isAuthed, route.chat);
app.get('/logout', route.isAuthed, route.logout);
app.get('/fbLogin', route.fbLogin);

idkMan(io);
