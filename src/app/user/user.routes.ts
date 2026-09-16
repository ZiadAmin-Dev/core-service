import { Router } from "express";
import { UserController } from "./controller/user.controller";
import { authentication } from "../../lib/auth/guard"
import {container} from "../../lib/di/container";
import { TOKENS } from "../../lib/di/tokens";

const userController = container.resolve<UserController>(TOKENS.UserController);

export const userRouter: Router = Router();

//protect
userRouter.get("/me", authentication ,userController.getMe)
userRouter.patch("/me", authentication, userController.updateMe)