import { z } from 'zod';

export const joinRoomSchema = z.object({
    roomId: z.string().min(1, "The room ID cannot be empty"),
    filter: z.string().optional(),
    userId: z.string().optional(),
});

export const swipeSchema = z.object({
    roomId: z.string(),
    gameId: z.number(),
    action: z.enum(['LIKE', 'DISLIKE']),
    userId: z.string().optional(),
});

export type JoinRoomData = z.infer<typeof joinRoomSchema>;
export type SwipeData = z.infer<typeof swipeSchema>;