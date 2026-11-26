export interface RoomState {
    startPage: number
    filter: string
    likes: Map<number, Set<string>>
    matched: Set<number>
    cleanupTimer: ReturnType<typeof setTimeout> | null
}

export const rooms = new Map<string, RoomState>()

export const onlineUsers = new Map<string, Set<string>>()