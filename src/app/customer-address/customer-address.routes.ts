import { Router } from "express";
import { customerAddressController } from "./controller/customer-address.controller";
import { authnetcation } from "../../lib/auth/guard"

export const addressRouter: Router = Router();

addressRouter.get("/", authnetcation, customerAddressController.getAll)
addressRouter.post("/", authnetcation, customerAddressController.createAddress)
addressRouter.patch("/:addressId", authnetcation, customerAddressController.updateAddress);
addressRouter.delete("/:addressId", authnetcation, customerAddressController.removeAddress);