import { Router } from "express";
import { userController } from "./controller/user.controller";
import { authnetcation } from "../../common/auth/guard"

export const userRouter: Router = Router();

//protect
userRouter.get("/me", authnetcation ,userController.getMe)
userRouter.patch("/me", authnetcation, userController.updateMe)