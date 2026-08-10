import { AddressService, addressService } from "../service/address.service";
import { validateBody } from "../../../common/validation/validate";
import { AddressDTO, UpdateAddressDTO } from "../dto/address.dto";
import { Request, Response, NextFunction } from "express";

export class AddressController{
    constructor(private readonly addressService: AddressService){}

    getAddresses = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const addresses = await this.addressService.getAddressesByUserId(req.user?.userId!)
            res.status(200).json({data: addresses})
        } catch(err) { next(err) ; }
    }

    addAddress = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(AddressDTO, req.body);
            const result = await this.addressService.addAddress(data, req.user!.userId);
            res.status(201).json({ message: "Address added", address: result});
        } catch(err) { next(err) ; }
    }

    updateAddress = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(UpdateAddressDTO, req.body);
            const addressId = Number(req.params.addressId);
            const result = await this.addressService.updateAddress(data, addressId, req.user!.userId);
        res.status(200).json({ message: "Address updated", address: result });
        } catch (err) { next(err); }
    }

    deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const addressId = Number(req.params.addressId);
            await this.addressService.deleteAddress(addressId, req.user!.userId);
            res.status(200).json({ message: "Address deleted" });
        } catch (err) { next(err); }
    }
}

export const addressController = new AddressController(addressService)