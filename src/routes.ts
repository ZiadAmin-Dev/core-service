import { Router } from "express";
import { healthRouter } from "./app/health/health.routes.js";
export const routes = Router();

routes.use("/health", healthRouter);


//user routes
//auth routes
//menu routes
//....