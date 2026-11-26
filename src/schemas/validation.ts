import { z } from 'zod'

const roomIdField = z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{1,32}$/, 'Invalid room code')

const filterField = z
    .string()
    .max(100)
    .regex(/^[a-z0-9=&,_-]*$/, 'Invalid filter')

const gameIdField = z.number().int().positive()

export const joinRoomSchema = z.object({
    roomId: roomIdField,
    filter: filterField.optional(),
    liked: z.array(gameIdField).max(500).optional(),
})

export const swipeSchema = z.object({
    roomId: roomIdField,
    gameId: gameIdField,
    action: z.enum(['LIKE', 'DISLIKE']),
})

export const unswipeSchema = z.object({
    roomId: roomIdField,
    gameId: gameIdField,
})

export const checkOnlineSchema = z.array(z.string().min(1).max(64)).max(200)

export type JoinRoomData = z.infer<typeof joinRoomSchema>
export type SwipeData = z.infer<typeof swipeSchema>
export type UnswipeData = z.infer<typeof unswipeSchema>