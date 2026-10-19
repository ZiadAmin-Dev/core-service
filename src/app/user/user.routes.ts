import { Router } from "express";
import { UserController } from "./controller/user.controller";
import { authentication } from "../../lib/auth/guard"
import {container} from "../../lib/di/container";
import { TOKENS } from "../../lib/di/tokens";
import { requireInternalApiKey } from "../../lib/auth/api-key";

const userController = container.resolve<UserController>(TOKENS.UserController);

export const userRouter: Router = Router();

//protect
userRouter.get("/me", authentication ,userController.getMe)
userRouter.patch("/me", authentication, userController.updateMe)

// Internal (service-to-service)
userRouter.get('/internal/agents/:id', requireInternalApiKey, userController.getAgentById);
    