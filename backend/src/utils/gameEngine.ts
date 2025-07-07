import { PrismaClient } from "../generated/prisma";
import { GameState } from "../generated/prisma";
import { getSocketIO } from "../socket";

const prisma = new PrismaClient();

const ROUND_DURATION_MS = 20_000; // 20s
const MAX_ROUNDS = 5;

// 📦 Stocke les timers actifs pour chaque partie
const activeTimers: Record<number, NodeJS.Timeout> = {};

export const startRound = async (gameId: number, roundNumber: number) => {
  const io = getSocketIO();
  const roomName = `game_${gameId}`;

  console.log(`▶️ Démarrage de la manche ${roundNumber} pour game ${gameId}`);

  // 📢 Notifie les joueurs
  io.to(roomName).emit("round_started", {
    round: roundNumber,
    timeLimit: ROUND_DURATION_MS / 1000,
  });

  // 🕒 Démarre le timer pour cette manche
  activeTimers[gameId] = setTimeout(async () => {
    await endRound(gameId, roundNumber);
  }, ROUND_DURATION_MS);
};

/**
 * 🏁 Termine la partie après le dernier round
 */
export const endRound = async (gameId: number, roundNumber: number) => {
  const io = getSocketIO();
  const roomName = `game_${gameId}`;

  console.log(`⛔ Fin de la manche ${roundNumber} pour game ${gameId}`);

  // 🔍 1. Récupère la GameQuestion et les réponses
  const gameQuestion = await prisma.gameQuestion.findFirst({
    where: { gameId, round: roundNumber },
    include: {
      question: true,
      answers: true,
    },
  });

  if (!gameQuestion) {
    console.warn("❌ GameQuestion introuvable.");
    return;
  }

  const correctIndex = gameQuestion.question.correctIndex;

  // 🧮 2. Parcours les réponses et met à jour les scores
  for (const answer of gameQuestion.answers) {
    const isCorrect = answer.index === correctIndex;
    if (isCorrect) {
      await prisma.gamePlayer.update({
        where: {
          gameId_userId: {
            gameId,
            userId: answer.userId,
          },
        },
        data: {
          score: { increment: 1 },
        },
      });
    }
  }

  // 📊 3. Récupère les scores à jour
  const players = await prisma.gamePlayer.findMany({
    where: { gameId },
    select: {
      userId: true,
      score: true,
      user: {
        select: {
          username: true,
        },
      },
    },
  });

  // 📢 4. Notifie les joueurs de la fin du round avec les scores
  io.to(roomName).emit("round_ended", {
    round: roundNumber,
    correctIndex,
    scores: players.map((p) => ({
      username: p.user.username,
      userId: p.userId,
      score: p.score,
    })),
  });

  // ⏱️ 5. Enchaîne ou termine la partie
  if (roundNumber >= MAX_ROUNDS) {
    await endGame(gameId); // 🎯 à implémenter
  } else {
    const nextRound = roundNumber + 1;

    // Mise à jour du round
    await prisma.game.update({
      where: { id: gameId },
      data: {
        round: nextRound,
      },
    });

    // Lancer le round suivant
    startRound(gameId, nextRound);
  }
};

export const endGame = async (gameId: number) => {
  const io = getSocketIO();
  const roomName = `game_${gameId}`;

  console.log(`🎯 Fin de la partie ${gameId}`);

  // 1. Marquer la partie comme terminée
  await prisma.game.update({
    where: { id: gameId },
    data: {
      state: GameState.FINISHED,
      finishedAt: new Date(),
    },
  });

  // 2. Récupérer les scores finaux
  const players = await prisma.gamePlayer.findMany({
    where: { gameId },
    orderBy: { score: "desc" },
    select: {
      userId: true,
      score: true,
      user: {
        select: { username: true },
      },
    },
  });

  // 3. Envoie l’événement à tous les joueurs de la room
  io.to(roomName).emit("game_ended", {
    gameId,
    results: players.map((player) => ({
      userId: player.userId,
      username: player.user.username,
      score: player.score,
    })),
  });

  // (optionnel) Quitter tous les sockets de la room
  const room = io.sockets.adapter.rooms.get(roomName);
  if (room) {
    for (const socketId of room) {
      const socket = io.sockets.sockets.get(socketId);
      socket?.leave(roomName);
    }
  }
};
