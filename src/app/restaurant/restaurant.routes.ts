import { Router } from "express";
import { restaurantController } from "./controller/restaurant.controller";
import { authnetcation } from "../../common/auth/guard";

export const restaurantRouter: Router = Router();

restaurantRouter.get("/", restaurantController.getAll)
restaurantRouter.get("/:restaurantId", restaurantController.getById);

restaurantRouter.patch("/:restaurantId",authnetcation, restaurantController.update);

restaurantRouter.patch("/:restaurantId/status",authnetcation, restaurantController.updateStatus);