import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../../types/express";

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token manquant" });

    const decodedToken = jwt.verify(token, "RANDOM_TOKEN_SECRET") as {
      userId: string;
    };
    req.auth = { userId: decodedToken.userId };

    next();
  } catch (error) {
    res.status(401).json({ error });
  }
};
