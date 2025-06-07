import { Router } from "express";
import { createQuiz, getAllQuizzes, getMyQuizzes, getQuizById } from "../controllers/quiz.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate); // Toutes les routes suivantes sont protégées

router.post("/", createQuiz);
router.get("/", getMyQuizzes);
router.get("/getAll",authenticate,getAllQuizzes)
router.get("/:id", getQuizById);

export default router;