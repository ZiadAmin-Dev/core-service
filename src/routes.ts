import { Router } from "express";
import { healthRouter } from "./app/health/health.routes";
import { authRouter } from "./app/auth/auth.routes";
export const routes = Router();

//health routes
routes.use("/health", healthRouter);

//auth routes
routes.use("/auth", authRouter);

