import { Express, Request, Response, NextFunction } from "express";
import { PrismaClient } from "../generated/prisma";
import { AuthRequest } from "../../types/express";

const prisma = new PrismaClient();

export const createQuiz = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }
  const { title } = req.body;
  const userId = parseInt(req.auth.userId);
  console.log(userId);
  try {
    const quiz = await prisma.quiz.create({
      data: { title: title, userId: userId },
    });
    res.status(200).json({ message: "Quiz créé avec succès" });
  } catch (error) {
    res.status(400).json(error);
  }
};

export const getAllQuiz = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }
  try {
    prisma.quiz
      .findMany()
      .then((quizzes) => res.status(200).json(quizzes))
      .catch((error) => res.status(400).json(error));
  } catch (error) {
    res.status(500).json(error);
  }
};

export const getQuizById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id;
  prisma.quiz
    .findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        questions: true,
      },
    })
    .then((quiz) => res.status(200).json({ quiz }))
    .catch((error) => res.status(400).json({ error }));
};
