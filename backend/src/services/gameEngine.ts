// gameEngine.ts

import { prisma } from "../lib/prisma";


export async function advanceToNextTurn(gameId: number) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      quiz: {
        include: { questions: true },
      },
      gameQuestions: true,
    },
  });

  if (!game) {
    throw new Error(`Jeu ${gameId} introuvable`);
  }

  if (game.endedAt) {
    throw new Error(`La partie ${gameId} est déjà terminée`);
  }

  const currentTurn = game.currentTurn || 1;
  const nextTurn = currentTurn + 1;

  // Fin du jeu si on dépasse le nombre maximum de questions
  if (currentTurn >= game.maxQuestions) {
    await prisma.game.update({
      where: { id: gameId },
      data: {
        endedAt: new Date(),
        currentQuestionId: null,
        turnStartedAt: null,
      },
    });
    return { status: "ended", message: "La partie est terminée" };
  }

  // Liste des questions déjà posées
  const usedQuestionIds = game.gameQuestions.map((gq) => gq.questionId);
  const remainingQuestions = game.quiz.questions.filter(
    (q) => !usedQuestionIds.includes(q.id)
  );

  if (remainingQuestions.length === 0) {
    // Fin de partie s’il n’y a plus de questions disponibles
    await prisma.game.update({
      where: { id: gameId },
      data: {
        endedAt: new Date(),
        currentQuestionId: null,
        turnStartedAt: null,
      },
    });
    return { status: "ended", message: "Plus de questions disponibles" };
  }

  // Choisir une question aléatoire parmi celles restantes
  const nextQuestion =
    remainingQuestions[Math.floor(Math.random() * remainingQuestions.length)];

  // Effectuer la mise à jour dans une transaction
  await prisma.$transaction([
    prisma.game.update({
      where: { id: gameId },
      data: {
        currentTurn: nextTurn,
        currentQuestionId: nextQuestion.id,
        turnStartedAt: new Date(),
      },
    }),
    prisma.gameQuestion.create({
      data: {
        gameId,
        questionId: nextQuestion.id,
        order: nextTurn,
      },
    }),
  ]);

  return {
    status: "ok",
    message: "Tour suivant démarré",
    nextTurn,
    question: {
      id: nextQuestion.id,
      question: nextQuestion.question,
      options: nextQuestion.options,
    },
  };
}