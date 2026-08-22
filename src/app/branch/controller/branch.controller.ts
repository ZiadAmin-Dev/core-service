import { BranchService, branchService } from "../service/branch.service";
import { validateBody } from "../../../common/validation/validate";
import { Request, Response, NextFunction } from "express";
import { CreateBranchDTO, UpdateBranchDTO, UpdateBranchStatusDTO } from "../dto/branch.dto";
import { SystemRole } from "../../user/entity/enums";


export class BranchController{
    constructor(private readonly branchService: BranchService){}

    findNearby = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const results = await this.branchService.findNearby(Number(req.query.lat), Number(req.query.lng));
            res.status(200).json({data: results});
        } catch(err) { next(err); }
    };

    findActiveByRestaurant = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const results = await this.branchService.findActiveByRestaurant(Number(req.params.restaurantId));
            res.status(200).json({data: results});
        } catch(err) { next(err); }
    };

    findByRestaurant = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const results = await this.branchService.findByRestaurant(Number(req.params.restaurantId));
            res.status(200).json({data: results});
        } catch(err) { next(err); }
    };

    create = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(CreateBranchDTO, req.body); 
            const branch = await this.branchService.create(Number(req.params.restaurantId), req.user?.userId!,req.user?.role! as SystemRole, data);
            res.status(201).json({message: "Branch Added Successfully", branch});
        } catch(err) { next(err); }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(UpdateBranchDTO, req.body); 
            const branch = await this.branchService.update(Number(req.params.branchId), req.user?.userId!, req.user?.role! as SystemRole, data);
            res.status(200).json({message: "Branch Updated Successfully", branch});
        } catch(err) { next(err); }
    };

    updateStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(UpdateBranchStatusDTO, req.body);
            const branch = await this.branchService.updateStatus(Number(req.params.branchId), req.user?.role! as SystemRole, data);

            res.status(200).json({
                message: "Branch status updated successfully",
                branch: {
                    id: branch!.id,
                    isActive: branch!.isActive,
                    acceptOrders: branch!.acceptOrders,
                    commission: branch!.commission
                }
            });
        } catch (err) { next(err); }
    };
}

export const branchController = new BranchController(branchService);