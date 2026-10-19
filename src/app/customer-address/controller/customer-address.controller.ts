import { CustomerAddressService } from "../service/customer-address.service";
import { validateBody } from "../../../lib/validation/validate";
import { createAddressDTO, UpdateAddressDTO } from "../dto/customer-address.request.dto";
import { Request, Response, NextFunction } from "express";
import { inject, injectable } from "tsyringe";
import { TOKENS } from "../../../lib/di/tokens";
import { sendSuccess } from "../../../lib/http/response";

@injectable()
export class CustomerAddressController{
    constructor(@inject(TOKENS.CustomerAddressService) private readonly customerAddressService: CustomerAddressService){}

    getAll = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const addresses = await this.customerAddressService.getByUserId(req.user?.userId!)
            res.status(200).json({data: addresses})
        } catch(err) { next(err) ; }
    }
    

    create = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(createAddressDTO, req.body);
            const address = await this.customerAddressService.create(data, req.user!.userId);
            res.status(201).json({ message: "Address added", address: address});
        } catch(err) { next(err) ; }
    }

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const addressId = Number(req.params.addressId);
            const data = await validateBody(UpdateAddressDTO, req.body);
            const address = await this.customerAddressService.update(data, addressId, req.user!.userId);
        res.status(200).json({ message: "Address updated", address });
        } catch (err) { next(err); }
    }

    remove = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const addressId = Number(req.params.addressId);
            await this.customerAddressService.remove(addressId, req.user!.userId);
            res.status(200).json({ message: "Address deleted" });
        } catch (err) { next(err); }
    }

    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const address = await this.customerAddressService.getById(Number(req.params.id));
            sendSuccess(res, address);
        } catch (err) {
            next(err);
        }
    }
}