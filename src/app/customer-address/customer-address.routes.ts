import { Router } from "express";
import { CustomerAddressController } from "./controller/customer-address.controller";
import { authentication } from "../../lib/auth/guard"
import { container } from "../../lib/di/container";
import { TOKENS } from "../../lib/di/tokens";

const customerAddressController = container.resolve<CustomerAddressController>(TOKENS.CustomerAddressController);

export const addressRouter: Router = Router();

addressRouter.get("/", authentication, customerAddressController.getAll)
addressRouter.post("/", authentication, customerAddressController.createAddress)
addressRouter.patch("/:addressId", authentication, customerAddressController.updateAddress);
addressRouter.delete("/:addressId", authentication, customerAddressController.removeAddress);