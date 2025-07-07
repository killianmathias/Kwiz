import { Express, Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createQuiz,
  getAllQuiz,
  getQuizById,
} from "../controllers/quiz.controller";

const quizRouter = Router();

quizRouter.post("/create", authMiddleware, createQuiz);
quizRouter.get("/getAll", authMiddleware, getAllQuiz);
quizRouter.get("/:id", authMiddleware, getQuizById);

export { quizRouter };
