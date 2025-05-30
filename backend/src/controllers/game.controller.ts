import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { JwtPayload } from "jsonwebtoken";
import { AuthRequest } from "../middlewares/auth.middleware"
import { advanceToNextTurn } from "../services/gameEngine";



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

    // Enregistre la réponse, en ajoutant le gameId requis
    const answer = await prisma.answer.create({
      data: {
        questionId,
        gamePlayerId: gamePlayer.id,
        selectedIndex,
        isCorrect,
        gameId, // 🔧 Ce champ est désormais requis
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

export const finishGame = async (req: AuthRequest, res: Response) => {
  try {
    const gameId = Number(req.params.id);

    if (!gameId) {
      return res.status(400).json({ message: "ID de la partie requis" });
    }

    // Met fin à la partie
    const updatedGame = await prisma.game.update({
      where: { id: gameId },
      data: { endedAt: new Date() },
      include: {
        players: {
          include: {
            user: true,
          },
        },
      },
    });

    // Trouve le score max
    const maxScore = Math.max(...updatedGame.players.map(p => p.score));

    // Trouve les gagnants (peut être plusieurs en cas d’égalité)
    const winners = updatedGame.players
      .filter(p => p.score === maxScore)
      .map(p => ({
        id: p.user.id,
        username: p.user.username,
        score: p.score,
      }));

    res.status(200).json({
      message: "Partie terminée",
      game: {
        id: updatedGame.id,
        endedAt: updatedGame.endedAt,
        players: updatedGame.players.map(p => ({
          id: p.user.id,
          username: p.user.username,
          score: p.score,
        })),
      },
      winners,
    });
  } catch (error) {
    console.error("Erreur lors de la fin de partie :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getGameLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const gameId = Number(req.params.id);

    if (!gameId) {
      return res.status(400).json({ message: "ID de la partie requis" });
    }

    // Vérifie que la partie existe
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!game) {
      return res.status(404).json({ message: "Partie introuvable" });
    }

    // Vérifie si la partie est terminée
    if (!game.endedAt) {
      return res.status(400).json({ message: "La partie n'est pas encore terminée" });
    }

    // Classement décroissant par score
    const leaderboard = game.players
      .sort((a, b) => b.score - a.score)
      .map((player, index) => ({
        rank: index + 1,
        userId: player.user.id,
        username: player.user.username,
        score: player.score,
      }));

    res.status(200).json({
      gameId: game.id,
      endedAt: game.endedAt,
      leaderboard,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du classement :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const getLiveScores = async (req: AuthRequest, res: Response) => {
  try {
    const gameId = Number(req.params.id);

    if (!gameId) {
      return res.status(400).json({ message: "ID de la partie requis" });
    }

    // Récupère les joueurs de la partie
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!game) {
      return res.status(404).json({ message: "Partie introuvable" });
    }

    const scores = game.players.map((player) => ({
      userId: player.user.id,
      username: player.user.username,
      score: player.score,
    }));

    res.status(200).json({
      gameId: game.id,
      scores,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des scores :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

export const startGame = async (req: Request, res: Response) => {
  const gameId = parseInt(req.params.id);

  if (isNaN(gameId)) {
    return res.status(400).json({ error: "Paramètre gameId invalide" });
  }

  try {
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        quiz: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!game) {
      return res.status(404).json({ error: "Jeu introuvable" });
    }

    const allQuestions = game.quiz.questions;

    if (allQuestions.length === 0) {
      return res.status(400).json({ error: "Aucune question disponible dans ce quiz" });
    }

    // Nombre aléatoire entre 6 et 10, sans dépasser le nombre dispo
    const numberOfQuestions = Math.min(
      Math.floor(Math.random() * 5) + 6,
      allQuestions.length
    );

    // Mélanger et sélectionner les questions
    const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffledQuestions.slice(0, numberOfQuestions);

    // Créer les GameQuestion
    await prisma.gameQuestion.createMany({
      data: selectedQuestions.map((q, index) => ({
        gameId: game.id,
        questionId: q.id,
        order: index,
      })),
    });

    // Définir la première question
    const firstQuestionId = selectedQuestions[0].id;

    // Mise à jour du jeu
    await prisma.game.update({
      where: { id: game.id },
      data: {
        maxQuestions: numberOfQuestions,
        currentTurn: 1,
        startedAt: new Date(),
        currentQuestionId: firstQuestionId,
        turnStartedAt: new Date(),
      },
    });

    return res.status(200).json({
      message: "Partie démarrée",
      gameId: game.id,
      totalQuestions: numberOfQuestions,
      currentQuestionId: firstQuestionId,
    });
  } catch (error) {
    console.error("Erreur lors du démarrage du jeu :", error);
    return res.status(500).json({ error: "Erreur serveur lors du démarrage du jeu" });
  }
};


export const nextTurn = async (req: AuthRequest, res: Response) => {
  try {
    const gameId = Number(req.params.id);
    if (!gameId) return res.status(400).json({ message: "ID invalide" });

    const result = await advanceToNextTurn(gameId);

    if (result.finished) {
      return res.status(200).json({ message: "La partie est terminée" });
    }

    return res.status(200).json({
      message: "Tour suivant lancé",
      currentTurn: result.currentTurn,
      question: result.question
    });

  } catch (error) {
    console.error("Erreur nextTurn :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
export const getCurrentGameState = async (req: AuthRequest, res: Response) => {
  try {
    const gameId = Number(req.params.id);

    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        currentQuestion: true, // Assure-toi que la relation est définie dans ton modèle Prisma
        players: {
          include: { user: true }
        }
      },
    });

    if (!game) {
      return res.status(404).json({ message: "Partie introuvable" });
    }

    if (!game.startedAt) {
      return res.status(400).json({ message: "La partie n'a pas encore commencé" });
    }

    if (game.endedAt) {
      return res.status(200).json({ message: "La partie est terminée" });
    }

    res.status(200).json({
      currentTurn: game.currentTurn,
      currentQuestion: game.currentQuestion,
      players: game.players.map(p => ({
        id: p.user.id,
        username: p.user.username,
        score: p.score,
      })),
      maxQuestions : game.maxQuestions
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'état actuel du jeu :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};