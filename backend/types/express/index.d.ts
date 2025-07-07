import { Request } from "express";

export interface AuthRequest extends Request {
  auth?: {
    userId: string;
  };
}
