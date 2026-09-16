import { Router } from "express";
import { RestaurantController } from "./controller/restaurant.controller";
import {rbac, requireRestaurantMember} from "../../lib/auth/rbac";
import { authentication } from "../../lib/auth/guard";
import {container} from "../../lib/di/container";
import { TOKENS } from "../../lib/di/tokens";
import { withCache } from "../../lib/cache/with.cache";
import { toSec } from "../../pkg/utils/time";

const restaurantController = container.resolve<RestaurantController>(TOKENS.RestaurantController);

export const restaurantRouter: Router = Router();

restaurantRouter.get("/", restaurantController.getAll)
restaurantRouter.get("/:restaurantId", restaurantController.getById);

restaurantRouter.post('/',
    authentication,
    restaurantController.create); // system_admin only, checked in service

restaurantRouter.patch("/:restaurantId",
    authentication,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:restaurant", action:"update"}),
    restaurantController.update);

restaurantRouter.patch("/:restaurantId/status",
    authentication,
    restaurantController.updateStatus); // system_admin only, checked in service