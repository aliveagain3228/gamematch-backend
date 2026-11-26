import { joinRoomSchema, swipeSchema, unswipeSchema } from '../schemas/validation'
import { rooms, type RoomState } from '../store/memoryStore'
import { config } from '../config'
import type { AppServer, AppSocket } from '../types/socket'

const toRoomKey = (roomId: string) => `room:${roomId}`

const getRoomUserIds = (io: AppServer, roomKey: string) => {
    const userIds = new Set<string>()
    const socketIds = io.sockets.adapter.rooms.get(roomKey)

    if (!socketIds) return userIds

    for (const socketId of socketIds) {
        const userId = io.sockets.sockets.get(socketId)?.data.userId
        if (userId) userIds.add(userId)
    }

    return userIds
}

const createRoom = (filter: string): RoomState => ({
    startPage: Math.floor(Math.random() * config.maxStartPage) + 1,
    filter,
    likes: new Map(),
    matched: new Set(),
    cleanupTimer: null,
})

const registerLike = (io: AppServer, roomKey: string, room: RoomState, userId: string, gameId: number) => {
    const likedBy = room.likes.get(gameId) ?? new Set<string>()
    likedBy.add(userId)
    room.likes.set(gameId, likedBy)

    if (likedBy.size >= 2 && !room.matched.has(gameId)) {
        room.matched.add(gameId)
        console.log(`MATCH in ${roomKey}, game ${gameId}`)
        io.to(roomKey).emit('match', { gameId })
    }
}

const syncLikes = (io: AppServer, roomKey: string, room: RoomState, userId: string, liked: number[]) => {
    const likedSet = new Set(liked)

    for (const [gameId, likedBy] of room.likes) {
        if (!likedSet.has(gameId)) likedBy.delete(userId)
    }

    for (const gameId of likedSet) {
        registerLike(io, roomKey, room, userId, gameId)
    }
}

const scheduleCleanup = (io: AppServer, roomKey: string) => {
    const room = rooms.get(roomKey)

    if (!room) return

    if (room.cleanupTimer) clearTimeout(room.cleanupTimer)

    room.cleanupTimer = setTimeout(() => {
        const members = io.sockets.adapter.rooms.get(roomKey)

        if (!members || members.size === 0) {
            rooms.delete(roomKey)
            console.log(`The room ${roomKey} was removed from memory`)
        }
    }, config.roomTtlMs)

    room.cleanupTimer.unref()
}

export const registerRoomHandlers = (io: AppServer, socket: AppSocket) => {
    const userId = socket.data.userId

    socket.on('join_room', async (data) => {
        const parsed = joinRoomSchema.safeParse(data)

        if (!parsed.success) {
            socket.emit('room_error', { message: 'Invalid room data' })
            return
        }

        const { roomId, filter, liked } = parsed.data
        const roomKey = toRoomKey(roomId)
        const members = getRoomUserIds(io, roomKey)

        if (!members.has(userId) && members.size >= config.maxPlayersPerRoom) {
            socket.emit('room_error', { message: 'This room is already full' })
            return
        }

        let room = rooms.get(roomKey)

        if (!room) {
            room = createRoom(filter ?? '')
            rooms.set(roomKey, room)
        }

        if (room.cleanupTimer) {
            clearTimeout(room.cleanupTimer)
            room.cleanupTimer = null
        }

        await socket.join(roomKey)

        socket.emit('room_setup', { startPage: room.startPage, filter: room.filter })

        if (!members.has(userId)) {
            socket.to(roomKey).emit('player_joined', { message: 'A player joined the room' })
        }

        if (liked) {
            syncLikes(io, roomKey, room, userId, liked)
        }

        console.log(`Player ${userId} joined room ${roomId}`)
    })

    socket.on('swipe', (data) => {
        const parsed = swipeSchema.safeParse(data)

        if (!parsed.success) return

        const { roomId, gameId, action } = parsed.data
        const roomKey = toRoomKey(roomId)
        const room = rooms.get(roomKey)

        if (!room || !socket.rooms.has(roomKey)) return

        if (action === 'DISLIKE') {
            room.likes.get(gameId)?.delete(userId)
            return
        }

        registerLike(io, roomKey, room, userId, gameId)
    })

    socket.on('unswipe', (data) => {
        const parsed = unswipeSchema.safeParse(data)

        if (!parsed.success) return

        const { roomId, gameId } = parsed.data
        const roomKey = toRoomKey(roomId)

        if (!socket.rooms.has(roomKey)) return

        rooms.get(roomKey)?.likes.get(gameId)?.delete(userId)
    })

    socket.on('disconnecting', () => {
        for (const roomKey of socket.rooms) {
            if (roomKey.startsWith('room:')) {
                scheduleCleanup(io, roomKey)
            }
        }
    })
}