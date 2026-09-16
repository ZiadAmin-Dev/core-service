import { Router } from "express";
import { BranchController } from "./controller/branch.controller";
import { authentication } from "../../lib/auth/guard"
import {rbac, requireRestaurantMember, requireBranchAccess} from "../../lib/auth/rbac";
import {container} from "../../lib/di/container";
import { TOKENS } from "../../lib/di/tokens";
import { withCache } from "../../lib/cache/with.cache";
import { toSec } from "../../pkg/utils/time";

const branchController = container.resolve<BranchController>(TOKENS.BranchController);

export const branchRouter = Router();

branchRouter.get('/branches/nearby', withCache(toSec(1, 'd')), branchController.findNearby)
branchRouter.get('/restaurants/:restaurantId/branches', branchController.findActiveByRestaurant)
branchRouter.get('/restaurants/:restaurantId/branches', branchController.findByRestaurant);

branchRouter.post('/restaurants/:restaurantId/branches',
    authentication,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:branch", action:'create'}),
    branchController.create)

branchRouter.patch("/branches/:branchId",
    authentication,
    requireBranchAccess('branchId'),
    rbac({resource:"core:branch", action:'update'}),
    branchController.update);

branchRouter.patch("/branches/:branchId/status",
    authentication,
    branchController.updateStatus); // system_admin only, checked in service