import { Express, Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import {
  createGame,
  finishGame,
  getGameStatus,
} from "../controllers/game.controller";

const gameRouter = Router();

gameRouter.post("/create/:quizId", authMiddleware, createGame);
gameRouter.post("/finish/:gameId", finishGame);
gameRouter.get("/:gameId", authMiddleware, getGameStatus);

export { gameRouter };
