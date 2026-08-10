import { Router } from "express";
import { addressController } from "./controller/address.controller";
import { authnetcation } from "../../common/auth/guard"

export const addressRouter: Router = Router();

addressRouter.get("/", authnetcation, addressController.getAddresses)
addressRouter.post("/", authnetcation, addressController.addAddress)
addressRouter.patch("/:addressId", authnetcation, addressController.updateAddress);
addressRouter.delete("/:addressId", authnetcation, addressController.deleteAddress);