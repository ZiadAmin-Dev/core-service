import { Router } from "express";
import { restaurantController } from "./controller/restaurant.controller";
import {rbac, requireRestaurantMember} from "../../lib/auth/rbac";
import { authnetcation } from "../../lib/auth/guard";

export const restaurantRouter: Router = Router();

restaurantRouter.get("/", restaurantController.getAll)
restaurantRouter.get("/:restaurantId", restaurantController.getById);

restaurantRouter.post('/',
    authnetcation,
    restaurantController.create); // system_admin only, checked in service

restaurantRouter.patch("/:restaurantId",
    authnetcation,
    requireRestaurantMember('restaurantId'),
    rbac({resource:"core:restaurant", action:"update"}),
    restaurantController.update);

restaurantRouter.patch("/:restaurantId/status",
    authnetcation,
    restaurantController.updateStatus); // system_admin only, checked in service