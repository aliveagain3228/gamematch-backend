import { Server, Socket } from 'socket.io'
import {ClientToServerEvents, ServerToClientEvents} from "../types/socket";
import { joinRoomSchema, swipeSchema } from "../schemas/validation";
import { roomLikes, roomPages, roomFilters} from "../store/memoryStore";

export const registerRoomHandlers = (
    io: Server<ClientToServerEvents, ServerToClientEvents>,
    socket: Socket<ClientToServerEvents, ServerToClientEvents>
)=> {
    socket.on('join_room', (data) => {

        const result = joinRoomSchema.safeParse(data)

        if (!result.success) {
            console.error("Zod validations error (join_room):", result.error.issues)
            return
        }

        const parsedData = result.data
        const room = parsedData.roomId

        socket.join(room)

        if (!roomPages[room]) {
            roomPages[room] = Math.floor(Math.random() * 100) + 1
            roomFilters[room] = parsedData.filter || ""
        }

        socket.emit('room_setup', {startPage: roomPages[room], filter: roomFilters[room]})
        socket.to(room).emit('player_joined', {message: 'A second player has joined!'})

        const user = parsedData.userId || socket.id
        console.log(`Player ${user} joined room: ${room}. Start page: ${roomPages[room]}, Filter: ${roomFilters[room]}`)

    })

    socket.on('swipe', (data) => {
        const result = swipeSchema.safeParse(data)

        if (!result.success) {
            console.error("Zod validations error (swipe):", result.error.issues)
            return
        }
        const { action, gameId, roomId, userId} = result.data
        const currentUserId = userId || socket.id

        console.log(`Player ${socket.id} set ${action} game ${gameId} in room ${roomId}`)

        if (action === 'LIKE') {
            if (!roomLikes[roomId]) {
                roomLikes[roomId] = {}
            }

            if (roomLikes[roomId][gameId] && roomLikes[roomId][gameId] !== currentUserId) {
                console.log(`🎉 MATCH IN ROOM ${roomId}! GAME: ${gameId}`)
                io.to(roomId).emit('match', { gameId })
            } else {
                roomLikes[roomId][gameId] = currentUserId
            }
        }
    })

    socket.on('disconnecting', () => {
        for (const room of socket.rooms) {
            if (room !== socket.id) {
                const roomInfo = io.sockets.adapter.rooms.get(room)

                if (!roomInfo || roomInfo.size <= 1) {
                    delete roomPages[room]
                    delete roomFilters[room]
                    delete roomLikes[room]
                    console.log(`🗑️ The room ${room} was deleted from memory`)
                }
            }
        }
    })
}