import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { JwtPayload } from "jsonwebtoken";
import { AuthRequest } from "../middlewares/auth.middleware"



export const createGame = async (req: AuthRequest, res: Response) => {
  try {
    const { quizId } = req.body;

    if (!quizId) {
      return res.status(400).json({ message: "quizId requis" });
    }

    // @ts-ignore : le token middleware ajoute `user` à req
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ message: "Utilisateur non authentifié" });
    }

    // Vérifie que le quiz existe
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz introuvable" });
    }

    // Crée la partie
    const game = await prisma.game.create({
      data: {
        quizId,
        players: {
          create: {
            userId,
            score: 0,
          },
        },
      },
      include: {
        players: true,
      },
    });

    res.status(201).json(game);
  } catch (error) {
    console.error("Erreur lors de la création de la partie :", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const joinGame = async (req: AuthRequest, res: Response) => {
  try {
    const { gameId } = req.body;
    const userId = req.userId;

    if (!gameId || !userId) {
      return res.status(400).json({ message: "gameId requis ou utilisateur non authentifié" });
    }

    // Vérifie que la partie existe
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true },
    });

    if (!game) {
      return res.status(404).json({ message: "Partie introuvable" });
    }

    // Vérifie si l'utilisateur a déjà rejoint la partie
    const alreadyJoined = await prisma.gamePlayer.findFirst({
      where: {
        gameId,
        userId,
      },
    });

    if (alreadyJoined) {
      return res.status(400).json({ message: "Utilisateur déjà dans la partie" });
    }

    // Ajoute le joueur à la partie
    const newPlayer = await prisma.gamePlayer.create({
      data: {
        gameId,
        userId,
        score: 0,
      },
    });

    res.status(201).json({
      message: "Utilisateur ajouté à la partie",
      player: newPlayer,
    });
  } catch (error) {
    console.error("Erreur lors de la tentative de rejoindre la partie :", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const submitAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { gameId, questionId, selectedIndex } = req.body;

    if (!gameId || !questionId || selectedIndex === undefined) {
      return res.status(400).json({ message: "Champs manquants" });
    }

    // Trouve le GamePlayer associé à ce user dans cette partie
    const gamePlayer = await prisma.gamePlayer.findFirst({
      where: {
        gameId,
        userId,
      },
    });

    if (!gamePlayer) {
      return res.status(404).json({ message: "Joueur non trouvé dans cette partie" });
    }

    // Récupère la question
    const question = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      return res.status(404).json({ message: "Question introuvable" });
    }

    // Vérifie si la réponse est correcte
    const isCorrect = question.correctIndex === selectedIndex;

    // Enregistre la réponse
    const answer = await prisma.answer.create({
      data: {
        questionId,
        gamePlayerId: gamePlayer.id,
        selectedIndex,
        isCorrect,
      },
    });

    // Met à jour le score du joueur si la réponse est correcte
    if (isCorrect) {
      await prisma.gamePlayer.update({
        where: { id: gamePlayer.id },
        data: {
          score: gamePlayer.score + 1,
        },
      });
    }

    res.status(201).json({ message: "Réponse enregistrée", answer });
  } catch (error) {
    console.error("Erreur lors de la soumission de la réponse :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};