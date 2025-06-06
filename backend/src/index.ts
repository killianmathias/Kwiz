import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import quizRoutes from "./routes/quiz.routes";
import authRoutes from "./routes/auth.routes";
import questionRoutes from "./routes/question.routes";
import gameRoutes from "./routes/game.routes";
import { startTurnTimer } from "./services/timerService";
import { initSocket } from "./sockets/socket";

const app = express();
const server = http.createServer(app); // 🔧 créer un serveur HTTP autour d'express
const io = new SocketIOServer(server, {
  cors: {
    origin: "*", // sécuriser ça plus tard
    methods: ["GET", "POST"],
  },
});

startTurnTimer();
initSocket(io); // 🔌 brancher la logique socket

const PORT = 3000;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/quizzes", quizRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/games", gameRoutes);

app.get("/bonjour", (_req, res) => {
  res.send("Hello World 👋");
});

server.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});