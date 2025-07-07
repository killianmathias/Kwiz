import { Express, Request, Response, NextFunction } from "express";
import { PrismaClient } from "../generated/prisma";
import { AuthRequest } from "../../types/express";
const prisma = new PrismaClient();

export const createQuestion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth) {
    return res.status(401).json({ error: "Utilisateur non authentifié" });
  }
  const { title, options, correctIndex, quizId } = req.body;
  const userId = parseInt(req.auth.userId);

  const user = await prisma.quiz.findUnique({
    where: {
      id: quizId,
    },
  });
  if (user?.userId != userId) {
    return res.status(401).json({
      message:
        "Vous ne pouvez pas créer de question pour ce quiz car vous n'avez pas les autorisations nécessaires.",
    });
  }
  try {
    const question = await prisma.question.create({
      data: {
        title: title,
        options: options,
        correctIndex: correctIndex,
        quizId: quizId,
      },
    });
    res.status(200).json({ message: "Question ajoutée avec succès au quiz!" });
  } catch (error) {
    res.status(400).json(error);
  }
};
