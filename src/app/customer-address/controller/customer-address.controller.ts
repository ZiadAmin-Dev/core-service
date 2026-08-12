import { CustomerAddressService, customerAddressService } from "../service/customer-address.service";
import { validateBody } from "../../../common/validation/validate";
import { createAddressDTO, UpdateAddressDTO } from "../dto/customer-address.dto";
import { Request, Response, NextFunction } from "express";

export class CustomerAddressController{
    constructor(private readonly addressService: CustomerAddressService){}

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const addresses = await this.addressService.getAddressesByUserId(req.user?.userId!)
            res.status(200).json({data: addresses})
        } catch(err) { next(err) ; }
    }

    createAddress = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(createAddressDTO, req.body);
            const address = await this.addressService.createAddress(data, req.user!.userId);
            res.status(201).json({ message: "Address added", address: address});
        } catch(err) { next(err) ; }
    }

    updateAddress = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const addressId = Number(req.params.addressId);
            const data = await validateBody(UpdateAddressDTO, req.body);
            const address = await this.addressService.updateAddress(data, addressId, req.user!.userId);
        res.status(200).json({ message: "Address updated", address });
        } catch (err) { next(err); }
    }

    removeAddress = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const addressId = Number(req.params.addressId);
            await this.addressService.removeAddress(addressId, req.user!.userId);
            res.status(200).json({ message: "Address deleted" });
        } catch (err) { next(err); }
    }
}

export const customerAddressController = new CustomerAddressController(customerAddressService)