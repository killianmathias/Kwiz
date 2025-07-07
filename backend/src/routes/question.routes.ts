import { Express, Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { createQuestion } from "../controllers/question.controller";

const questionRouter = Router();

questionRouter.post("/create", authMiddleware, createQuestion);

export { questionRouter };
