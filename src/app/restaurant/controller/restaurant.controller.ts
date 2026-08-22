import { RestaurantService, restaurantService } from "../service/restaurant.service";
import { validateBody } from "../../../common/validation/validate";
import { Request, Response, NextFunction } from "express";
import { UpdateRestaurantDTO, UpdateRestaurantStatusDTO } from "../dto/restaurant.dto";


export class RestaurantController {
    constructor(private readonly restaurantService:RestaurantService){}

    getById = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const result = await this.restaurantService.findById(Number(req.params.restaurantId))
            res.status(200).json({data: result});
        }catch (err) { next(err); }
    }

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

    update = async(req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(UpdateRestaurantDTO, req.body);
            const resraurant = await this.restaurantService.update(Number(req.params.restaurantId), data)
            res.status(200).json({ message: "restaurant updated", resraurant });
        } catch (err) { next(err); }
    }

    updateStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(UpdateRestaurantStatusDTO, req.body);
            const restaurant = await this.restaurantService.updateStatus(Number(req.params.restaurantId), req.user!.role, data.status);
            res.status(200).json({ message: "restaurant status updated", restaurant: { id: restaurant.id, name: restaurant.name, status: restaurant.status } });
        } catch (err) { next(err); }
    };
}

export const restaurantController = new RestaurantController(restaurantService)