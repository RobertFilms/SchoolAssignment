const io = require('socket.io')();

function socket(sessionMiddleware) {

    io.use((socket, next) => {
        sessionMiddleware(socket.request, {}, next);
    });

    io.on('connection', (socket) => {
        console.log('User connected');
        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
}

module.exports = socket;