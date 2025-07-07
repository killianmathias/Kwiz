import { signUp, logIn, getUserById } from "../controllers/auth.controller";
import { Express, Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";

const authRouter = Router();

authRouter.post("/signUp", signUp);
authRouter.post("/logIn", logIn);
authRouter.post("/getUser/:id", authMiddleware, getUserById);

export { authRouter };
