import { checkOnlineSchema } from '../schemas/validation'
import { onlineUsers } from '../store/memoryStore'
import type { AppSocket } from '../types/socket'

export const registerPresenceHandlers = (socket: AppSocket) => {
    const userId = socket.data.userId

    const sockets = onlineUsers.get(userId) ?? new Set<string>()
    sockets.add(socket.id)
    onlineUsers.set(userId, sockets)

    socket.on('check_online', (ids, ack) => {
        if (typeof ack !== 'function') return

        const parsed = checkOnlineSchema.safeParse(ids)

        ack(parsed.success ? parsed.data.filter((id) => onlineUsers.has(id)) : [])
    })

    socket.on('disconnect', () => {
        const current = onlineUsers.get(userId)

        if (!current) return

        current.delete(socket.id)

        if (current.size === 0) {
            onlineUsers.delete(userId)
        }
    })
}