import { Router } from "express";
import { createQuiz, getMyQuizzes } from "../controllers/quiz.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate); // Toutes les routes suivantes sont protégées

router.post("/", createQuiz);
router.get("/", getMyQuizzes);

export default router;