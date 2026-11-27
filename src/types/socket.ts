import type { Server, Socket } from 'socket.io'
import type { JoinRoomData, LeaveRoomData, SwipeData, UnswipeData } from '../schemas/validation'

export interface ServerToClientEvents {
    room_setup: (data: { startPage: number; filter: string }) => void
    room_error: (data: { message: string }) => void
    player_joined: (data: { message: string }) => void
    player_left: (data: { message: string }) => void
    match: (data: { gameId: number }) => void
}

export interface ClientToServerEvents {
    join_room: (data: JoinRoomData) => void
    leave_room: (data: LeaveRoomData) => void
    swipe: (data: SwipeData) => void
    unswipe: (data: UnswipeData) => void
    check_online: (ids: string[], ack: (online: string[]) => void) => void
}

export interface SocketData {
    userId: string
}

export type InterServerEvents = Record<string, never>

export type AppServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>

export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>