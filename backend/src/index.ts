import express from "express";
import cors from "cors";
import quizRoutes from "./routes/quiz.routes";
import authRoutes from "./routes/auth.routes";
import questionRoutes from "./routes/question.routes";
import gameRoutes from "./routes/game.routes"
import { startTurnTimer } from "./services/timerService";

startTurnTimer();




const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

//Routes :
app.use("/api/quizzes", quizRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/games",gameRoutes)

app.get("/bonjour", (req, res) => {
  res.send("Hello World 👋");
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});