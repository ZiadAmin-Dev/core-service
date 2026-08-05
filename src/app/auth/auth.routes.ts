import { Router } from "express";
import { authController } from "./controller/auth.controller";

export const authRouter: Router = Router();

authRouter.post("/register", authController.register);