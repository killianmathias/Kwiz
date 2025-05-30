// gameEngine.ts

import { prisma } from "../lib/prisma";

export async function advanceToNextTurn(gameId: number): Promise<{
  finished: boolean,
  currentTurn?: number,
  question?: {
    id: number,
    question: string,
    options: string[]
  }
}> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      gameQuestions: {
        orderBy: { order: 'asc' },
        include: { question: true },
      },
    },
  });

  if (!game || game.endedAt) {
    return { finished: true };
  }

  const currentIndex = game.currentTurn; // 1-based

  if (currentIndex >= game.maxQuestions || currentIndex >= game.gameQuestions.length) {
    await prisma.game.update({
      where: { id: gameId },
      data: {
        endedAt: new Date(),
        currentQuestionId: null,
        turnStartedAt: null,
      },
    });

    return { finished: true };
  }

  const nextGameQuestion = game.gameQuestions[currentIndex]; // currentTurn = 1 → index 1

  await prisma.game.update({
    where: { id: gameId },
    data: {
      currentTurn: currentIndex + 1,
      currentQuestionId: nextGameQuestion.questionId,
      turnStartedAt: new Date(),
    },
  });

  return {
    finished: false,
    currentTurn: currentIndex + 1,
    question: {
      id: nextGameQuestion.question.id,
      question: nextGameQuestion.question.question,
      options: nextGameQuestion.question.options,
    }
  };
}