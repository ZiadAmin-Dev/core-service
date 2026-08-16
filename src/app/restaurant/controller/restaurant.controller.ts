import { RestaurantService, restaurantService } from "../service/restaurant.service";
import { validateBody } from "../../../common/validation/validate";
import { Request, Response, NextFunction } from "express";


export class RestaurantController {
    constructor(private readonly restaurantService:RestaurantService){}

    getAll = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const result = await this.restaurantService.findAll();
            res.status(200).json({data: result});
        }catch (err) { next(err); }
    }

    getActive = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const result = await this.restaurantService.findActive();
            res.status(200).json({data: result});
        }catch (err) { next(err); }
    }
}

export const restaurantController = new RestaurantController(restaurantService)