import { Router } from "express";
import { branchController } from "./controller/branch.controller";
import { authnetcation } from "../../lib/auth/guard"
import {rbac, requireRestaurantMember, requireBranchAccess} from "../../lib/auth/rbac";

export const branchRouter = Router();

branchRouter.get('/branches/nearby', branchController.findNearby)
branchRouter.get('/restaurants/:restaurantId/branches', branchController.findActiveByRestaurant)
branchRouter.get('/restaurants/:restaurantId/branches', branchController.findByRestaurant);

branchRouter.post('/restaurants/:restaurantId/branches',
    authnetcation,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:branch", action:'create'}),
    branchController.create)

branchRouter.patch("/branches/:branchId",
    authnetcation,
    requireBranchAccess('branchId'),
    rbac({resource:"core:branch", action:'update'}),
    branchController.update);

branchRouter.patch("/branches/:branchId/status", authnetcation, branchController.updateStatus); // system_admin only, checked in service