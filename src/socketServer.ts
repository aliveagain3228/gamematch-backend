import { Server } from 'socket.io'
import { jwtVerify } from 'jose'
import type * as http from 'http'
import { config } from './config'
import { registerRoomHandlers } from './handlers/roomHandlers'
import { registerPresenceHandlers } from './handlers/presenceHandlers'
import type {
    AppServer,
    ClientToServerEvents,
    InterServerEvents,
    ServerToClientEvents,
    SocketData,
} from './types/socket'

export const initSocket = (server: http.Server): AppServer => {
    const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
        cors: {
            origin: config.allowedOrigins,
            methods: ['GET', 'POST'],
        },
        maxHttpBufferSize: 10_000,
    })

    io.use(async (socket, next) => {
        const token: unknown = socket.handshake.auth?.token

        if (typeof token !== 'string' || token.length === 0) {
            next(new Error('unauthorized'))
            return
        }

        try {
            const { payload } = await jwtVerify(token, config.socketAuthSecret, {
                algorithms: ['HS256'],
                issuer: config.tokenIssuer,
                audience: config.tokenAudience,
            })

            if (!payload.sub) {
                next(new Error('unauthorized'))
                return
            }

            socket.data.userId = payload.sub
            next()
        } catch {
            next(new Error('unauthorized'))
        }
    })

    io.on('connection', (socket) => {
        console.log('Player connected:', socket.data.userId)
        registerPresenceHandlers(socket)
        registerRoomHandlers(io, socket)
        socket.on('disconnect', () => {
            console.log('Player disconnected:', socket.data.userId)
        })
    })

    return io
}