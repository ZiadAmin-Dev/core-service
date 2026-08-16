import { BranchService, branchService } from "../service/branch.service";
import { validateBody } from "../../../common/validation/validate";
import { Request, Response, NextFunction } from "express";
import { CreateBranchDTO } from "../dto/branch.dto";
import { SystemRole } from "../../user/entity/enums";


export class BranchController{
    constructor(private readonly branchService: BranchService){}

    findNearby = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const results = await this.branchService.findNearby(Number(req.query.lat), Number(req.query.lng));
            res.status(200).json({data: results});
        } catch(err) { next(err); }
    }



    create = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(CreateBranchDTO, req.body); 
            const branch = await this.branchService.create(Number(req.params.restaurantId), req.user?.userId!,req.user?.role! as SystemRole, data);
            console.log("USER FROM JWT:", {
                    userId: req.user?.userId,
                    role: req.user?.role
                });
            res.status(201).json({message: "Branch Added Successfully", branch});
        } catch(err) { next(err); }
    }
}

export const branchController = new BranchController(branchService)