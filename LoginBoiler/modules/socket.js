function idkMan(io) {
    io.on('connection', (socket) => {
        console.log('a user connected');

        socket.on('chatMessage', (data) => {
            console.log('message: ' + data.message);
            io.emit('chatMessage', { user: data.user, message: data.message });
        });

        socket.on('join', (user) => {
            io.emit('chatMessage', { user: 'System', message: `${user} has joined` });
        });

        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
    });
}

module.exports = {
    idkMan
};