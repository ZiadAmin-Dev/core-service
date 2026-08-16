import { Router } from "express";
import { branchController } from "./controller/branch.controller";
import { authnetcation } from "../../common/auth/guard"

export const branchRouter = Router();

branchRouter.get('/branches/nearby', branchController.findNearby)
branchRouter.post('/restaurants/:restaurantId/branches', authnetcation, branchController.create)