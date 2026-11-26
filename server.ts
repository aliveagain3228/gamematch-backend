import express from 'express'
import http from 'http'
import cors from 'cors'
import { config } from './src/config'
import { initSocket } from './src/socketServer'

const app = express()
app.use(cors({ origin: config.allowedOrigins }))

app.get('/health', (_req, res) => {
    res.json({ ok: true })
})

const server = http.createServer(app)
const io = initSocket(server)

server.listen(config.port, () => {
    console.log(`The backend is running on port ${config.port} 🚀`)
})

const shutdown = () => {
    setTimeout(() => process.exit(1), 5000).unref()
    void io.close(() => process.exit(0))
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)