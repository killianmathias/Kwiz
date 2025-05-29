import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "secretdev";

interface AuthRequest extends Request {
  userId?: number;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token manquant" });

  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, SECRET) as { userId: number };
    req.userId = payload.userId;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token invalide" });
  }
};
export type { AuthRequest };