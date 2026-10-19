import { Router } from "express";
import { CustomerAddressController } from "./controller/customer-address.controller";
import { authentication } from "../../lib/auth/guard"
import { container } from "../../lib/di/container";
import { TOKENS } from "../../lib/di/tokens";
import { requireInternalApiKey } from "../../lib/auth/api-key";
    

const customerAddressController = container.resolve<CustomerAddressController>(TOKENS.CustomerAddressController);

export const customerAddressRouter = Router();

customerAddressRouter.get("/", authentication, customerAddressController.getAll)
customerAddressRouter.post("/", authentication, customerAddressController.create)
customerAddressRouter.patch("/:addressId", authentication, customerAddressController.update);
customerAddressRouter.delete("/:addressId", authentication, customerAddressController.remove);

// Internal (service-to-service)
customerAddressRouter.get('/internal/:id', requireInternalApiKey, customerAddressController.getById);
