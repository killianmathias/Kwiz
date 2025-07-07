import express from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import { authRouter } from "./routes/auth.routes";
import { quizRouter } from "./routes/quiz.routes";
import { questionRouter } from "./routes/question.routes";
import { gameRouter } from "./routes/game.routes";
import { initSocket } from "./socket";

const app = express();
const server = http.createServer(app);
initSocket(server);

const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use("/auth", authRouter);
app.use("/quiz", quizRouter);
app.use("/question", questionRouter);
app.use("/game", gameRouter);

app.get("/bonjour", (_req, res) => {
  res.send("Hello World 👋");
});

server.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
