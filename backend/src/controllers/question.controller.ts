// src/controllers/question.controller.ts
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const addQuestion = async (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizId);
  const { question, options, correctIndex } = req.body;

  if (!Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ message: "Il faut au moins deux options" });
  }

  if (correctIndex < 0 || correctIndex >= options.length) {
    return res.status(400).json({ message: "L'index de la bonne réponse est invalide" });
  }

  try {
    const created = await prisma.question.create({
      data: {
        quizId,
        question,
        options,
        correctIndex,
      },
    });

    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la création de la question" });
  }
};

export const getQuestions = async (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizId);

  try {
    const questions = await prisma.question.findMany({
      where: { quizId },
    });

    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération des questions" });
  }
};