const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { z } = require('zod')


const joinRoomSchema = z.object({
    roomId: z.string().min(1, "The room ID cannot be empty"),
    filter: z.string().optional()
})

const swipeSchema = z.object({
    roomId: z.string(),
    gameId: z.number(),
    action: z.enum(['LIKE', 'DISLIKE'])
})

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: '*',
    methods: ['GET', 'POST']
    }
});

const roomLikes = {}

const roomPages = {}

const roomFilters = {}


io.on('connection', (socket) => {
    console.log('A new player is online. Connection ID:', socket.id);

    socket.on('join_room', (data) => {
        try {
            const parsedData = joinRoomSchema.parse(data)
            const room = parsedData.roomId

            socket.join(String(room))

            if (!roomPages[room]) {
                roomPages[room] = Math.floor(Math.random() * 100) + 1
                roomFilters[room] = parsedData.filter || ""
            }

            console.log(`Player ${socket.id} joined in room: ${room}. Start page: ${roomPages[room]}, Filter: ${roomFilters[room]}`)
            socket.emit('room_setup', { startPage: roomPages[room], filter: roomFilters[room] })
            socket.to(room).emit('player_joined', { message: 'A second player has joined!' })

        } catch (err) {
            console.error("Zod validation error:", err.errors);
        }
    })

    socket.on('swipe', (data) => {
        try {
            const parsedData = swipeSchema.parse(data)
            const { action, gameId, roomId } = parsedData
            console.log(`Player ${socket.id} set ${parsedData.action} game ${parsedData.gameId} in room ${parsedData.roomId}`);

            if (action === 'LIKE') {
                if (!roomLikes[roomId]) {
                    roomLikes[roomId] = {}
                }
                if (roomLikes[roomId][gameId] && roomLikes[roomId][gameId] !== socket.id) {
                    console.log(`🎉 MATCH IN ROOM ${roomId}! GAME: ${gameId}`)
                    io.to(String(roomId)).emit('match', {gameId})
                } else {
                    roomLikes[roomId][gameId] = socket.id
                }
            }
        } catch(err) {
            console.error("Zod error when swiping:", err.errors)
        }
    })

    socket.on('disconnect', () => {
        console.log('A new player is offline:', socket.id);
    })
})

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`The backend is running on port ${PORT} 🚀`)
})