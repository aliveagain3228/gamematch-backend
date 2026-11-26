const parseOrigins = (value: string | undefined) =>
    (value ?? 'http://localhost:3000')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)

const socketAuthSecret = process.env.SOCKET_AUTH_SECRET ?? ''

if (socketAuthSecret.length < 32) {
    throw new Error('SOCKET_AUTH_SECRET must be set and at least 32 characters long')
}

export const config = {
    port: Number(process.env.PORT) || 3001,
    allowedOrigins: parseOrigins(process.env.CLIENT_ORIGIN),
    socketAuthSecret: new TextEncoder().encode(socketAuthSecret),
    tokenIssuer: 'gamematch-web',
    tokenAudience: 'gamematch-socket',
    maxPlayersPerRoom: Number(process.env.ROOM_MAX_PLAYERS) || 2,
    roomTtlMs: 10 * 60 * 1000,
    maxStartPage: 50,
} as const