import {JoinRoomData, SwipeData} from "../schemas/validation";

export interface ServerToClientEvents {
    room_setup: (data: { startPage: number, filter: string }) => void
    player_joined: (data: { message: string }) => void
    match: (data: { gameId: number }) => void
}

export interface ClientToServerEvents {
    join_room: (data: JoinRoomData) => void
    swipe: (data: SwipeData) => void
}