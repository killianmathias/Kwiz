import { Router } from "express";
import { createGame, getLiveScores, startGame, nextTurn,getCurrentGameState, joinGame, submitAnswer,finishGame,getGameLeaderboard } from "../controllers/game.controller";
import { authenticate } from "../middlewares/auth.middleware";


const router = Router();

// Création d'une partie
router.post("/", authenticate, createGame);

router.post("/join", authenticate, joinGame);
router.post("/:gameId/answer", authenticate, submitAnswer);
router.post("/:gameId/finish", authenticate, finishGame);
router.get("/:id/leaderboard", authenticate, getGameLeaderboard);
router.get("/:id/scores", authenticate,getLiveScores)
router.post("/:id/start",authenticate,startGame)
router.post("/:id/next-turn", authenticate, nextTurn);
router.get("/:id/current", authenticate, getCurrentGameState);


export default router;
