import { Router } from "express";
import { AuthController } from "./controller/auth.controller";

export const authRouter = Router();

authRouter.post("/register", AuthController.register);