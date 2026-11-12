import express from 'express';
import http from 'http';
import cors from 'cors';
import { initSocket } from './src/socket';


const app = express();
app.use(cors());

const server = http.createServer(app);

initSocket(server);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`The backend is running on port ${PORT} 🚀`)
})


