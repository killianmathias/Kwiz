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

export const getQuizById = async (req: Request, res: Response) => {
  const quizId = parseInt(req.params.id);

  if (isNaN(quizId)) {
    return res.status(400).json({ message: "ID invalide" });
  }

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            // si besoin, tu peux inclure les réponses ici
            // answers: true
          }
        }
      },
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz non trouvé" });
    }

    res.json(quiz);
  } catch (error) {
    console.error("Erreur lors de la récupération du quiz :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};