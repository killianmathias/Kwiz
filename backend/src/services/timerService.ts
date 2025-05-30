import { prisma } from "../lib/prisma";
import { advanceToNextTurn } from "./gameEngine";

const TURN_DURATION_MS = 30_000; // 30 secondes

async function checkTurnTimeouts() {
  const now = new Date();

  // Récupère toutes les parties en cours avec un tour démarré il y a plus de 30 secondes
  const games = await prisma.game.findMany({
    where: {
      endedAt: null,
      startedAt: { not: null },
      turnStartedAt: {
        lte: new Date(now.getTime() - TURN_DURATION_MS),
      },
    },
    include: {
      players: true,
      gameQuestions: true,
    },
  });

  for (const game of games) {
    // Trouve les joueurs qui n'ont pas répondu à la question en cours
    const currentQuestionId = game.currentQuestionId;
    if (!currentQuestionId) continue;

    const answers = await prisma.answer.findMany({
      where: {
        gameId: game.id,
        questionId: currentQuestionId,
      },
    });

    const answeredPlayerIds = new Set(answers.map(a => a.gamePlayerId));
    const missingPlayers = game.players.filter(p => !answeredPlayerIds.has(p.id));

    // Pour chaque joueur absent, crée une réponse fausse automatique
    for (const player of missingPlayers) {
      await prisma.answer.create({
        data: {
          gameId: game.id,
          gamePlayerId: player.id,
          questionId: currentQuestionId,
          selectedIndex: -1, // -1 pour aucune réponse
          isCorrect: false,
        },
      });
    }

    // Appelle la logique pour passer au tour suivant (à créer si tu ne l'as pas)
    await passToNextTurn(game.id);
  }
}

// Simple fonction qui tourne en boucle
export function startTurnTimer() {
  setInterval(checkTurnTimeouts, 5000); // toutes les 5 secondes
}

// La fonction passToNextTurn doit exécuter la logique similaire à ta route nextTurn (mais côté serveur)

export async function passToNextTurn(gameId: number) {
  const result = await advanceToNextTurn(gameId);
  if (result.finished) {
    console.log(`Jeu ${gameId} terminé automatiquement`);
  } else {
    console.log(`Tour ${result.currentTurn} lancé automatiquement pour le jeu ${gameId}`);
  }
}