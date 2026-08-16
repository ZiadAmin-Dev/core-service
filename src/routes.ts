import { Router } from "express";
import { healthRouter } from "./app/health/health.routes";
import { authRouter } from "./app/auth/auth.routes";
import { userRouter } from "./app/user/user.routes";
import { addressRouter } from "./app/customer-address/customer-address.routes";
import { restaurantRouter } from "./app/restaurant/restaurant.routes";
import { branchRouter } from "./app/branch/branch.routes";

export const routes = Router();

//health routes
routes.use("/health", healthRouter);

//auth routes
routes.use("/auth", authRouter);

//user routes
routes.use("/user", userRouter);

//address route
routes.use("/customer/addresses", addressRouter);

//restaurant route
routes.use("/restaurants", restaurantRouter);

//branch route
routes.use("/", branchRouter);
