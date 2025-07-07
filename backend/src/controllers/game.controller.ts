import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../generated/prisma";
import { GameState } from "../generated/prisma";
import { AuthRequest } from "../../types/express";
import { getSocketIO } from "../socket";
import { error } from "console";
import { Socket } from "socket.io";
import { startRound } from "../utils/gameEngine";

const prisma = new PrismaClient();

export const createGame = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const quizId = parseInt(req.params.quizId);
  if (isNaN(quizId)) {
    return res.status(400).json({ erreur: "quizId invalide" });
  }

  if (!req.auth) {
    return res.status(401).json({ erreur: "Utilisateur manquant !" });
  }

  try {
    const userId = parseInt(req.auth.userId);

    const game = await prisma.game.create({
      data: {
        quizId,
        state: GameState.WAITING,
        round: 0,
      },
    });

    await prisma.gamePlayer.create({
      data: {
        gameId: game.id,
        userId,
      },
    });

    res.status(201).json(game);
  } catch (error) {
    next(error);
  }
};

export const finishGame = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const gameId = parseInt(req.params.gameId);
  if (isNaN(gameId)) {
    return res.status(400).json({ erreur: "gameId invalide" });
  }

  try {
    await prisma.game.update({
      where: { id: gameId },
      data: { state: GameState.FINISHED },
    });
    res.status(200).json({ succès: "La partie est terminée !" });
  } catch (error) {
    next(error);
  }
};

export const getGameStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const gameId = parseInt(req.params.gameId);
  if (isNaN(gameId)) {
    return res.status(400).json({ erreur: "gameId invalide" });
  }

  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });
    res.status(200).json(game);
  } catch (error) {
    next(error);
  }
};

export const endGame = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const gameId = parseInt(req.params.gameId);
  if (isNaN(gameId)) {
    return res.status(400).json({ error: "gameId invalide" });
  }
  try {
    const game = await prisma.game.findUnique({
      where: {
        id: gameId,
      },
    });
    if (!game) {
      return res.status(400).json({ error: "Partie introuvable" });
    }
    if (game.state == GameState.FINISHED) {
      return res.status(400).json({ error: "La partie est déjà terminée" });
    }

    await prisma.game.update({
      where: {
        id: gameId,
      },
      data: { state: GameState.FINISHED },
    });
  } catch (error) {
    res.status(400).json({ error });
  }
};
