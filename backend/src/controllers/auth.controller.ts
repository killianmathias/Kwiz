import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const SECRET = process.env.JWT_SECRET || "secretdev";

export const register = async (req: Request, res: Response) => {
  const { email, password, username } = req.body;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) return res.status(400).json({ message: "Utilisateur déjà existant" });

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, username, password: hashed },
  });

  res.json({ id: user.id, email: user.email, username: user.username });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "Mot de passe incorrect" });

  const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: "7d" });

  res.json({ token, user: { id: user.id, username: user.username } });
};