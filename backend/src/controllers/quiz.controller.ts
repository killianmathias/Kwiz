import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const createQuiz = async (req: Request, res: Response) => {
  const { title } = req.body;
  const userId = (req as any).userId;

  if (!title) return res.status(400).json({ message: "Titre requis" });

  const quiz = await prisma.quiz.create({
    data: {
      title,
      userId,
    },
  });

  res.json(quiz);
};

export const getMyQuizzes = async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const quizzes = await prisma.quiz.findMany({
    where: { userId },
    include: { questions: true },
  });

  res.json(quizzes);
};

export const getAllQuizzes = async (req: Request, res: Response) => {
  const quizzes = await prisma.quiz.findMany({
    include: { questions: true },
  });

  res.json(quizzes);
};