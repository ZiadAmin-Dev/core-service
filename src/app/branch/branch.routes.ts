import { Router } from "express";
import { branchController } from "./controller/branch.controller";
import { authnetcation } from "../../common/auth/guard"

export const branchRouter = Router();

branchRouter.get('/branches/nearby', branchController.findNearby)

branchRouter.get('/restaurants/:restaurantId/branches', branchController.findActiveByRestaurant)

branchRouter.post('/restaurants/:restaurantId/branches', authnetcation, branchController.create)

branchRouter.patch("/branches/:branchId", authnetcation, branchController.update);

branchRouter.patch("/branches/:branchId/status", authnetcation, branchController.updateStatus);