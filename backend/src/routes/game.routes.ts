import { Router } from "express";
import { createGame } from "../controllers/game.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { joinGame } from "../controllers/game.controller";
import { submitAnswer } from "../controllers/game.controller";

const router = Router();

// Création d'une partie
router.post("/", authenticate, createGame);

router.post("/join", authenticate, joinGame);
router.post("/:gameId/answer", authenticate, submitAnswer);

export default router;
