import { Server } from 'socket.io';
import * as http from 'http';
import { ClientToServerEvents, ServerToClientEvents } from './types/socket';
import { registerRoomHandlers } from './handlers/roomHandlers';

export const initSocket = (server: http.Server) => {
    const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    })

    io.on('connection', (socket) => {
        console.log('A new player is online. Connection ID:', socket.id)
        registerRoomHandlers(io, socket)
        socket.on ('disconnect', () => {
            console.log('A player is offline:', socket.id)
        })
    })

    return io
}