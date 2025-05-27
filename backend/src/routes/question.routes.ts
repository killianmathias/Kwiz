import { Router } from "express";
import { addQuestion, getQuestions } from "../controllers/question.controller";

const router = Router();

router.post("/:quizId", addQuestion);        // Ajouter une question
router.get("/:quizId", getQuestions);        // Obtenir les questions d’un quiz

export default router;