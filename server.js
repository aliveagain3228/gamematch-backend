const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: 'http://localhost:3000' }
});

io.on('connection', (socket) => {
    console.log('A new player is online. Connection ID:', socket.id);

    socket.on('disconnect', () => {
        console.log('A new player is offline:', socket.id);
    })
})

server.listen(3001, () => {
    console.log('The backend is running on port 3001 🚀')
});