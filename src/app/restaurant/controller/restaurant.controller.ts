import { RestaurantService } from "../service/restaurant.service";
import { validateBody, validateQuery } from "../../../lib/validation/validate";
import { Request, Response, NextFunction } from "express";
import { CreateRestaurantDTO, UpdateRestaurantDTO, UpdateRestaurantStatusDTO } from "../dto/restaurant.request.dto";
import { ListRestaurantsQueryDTO } from "../dto/restaurant.query.dto";
import { SystemRole } from "../../user/user.enums";
import { TOKENS } from "../../../lib/di/tokens";
import { injectable, inject } from "tsyringe";
import { sendPaginated, sendSuccess } from "../../../lib/http/response";

@injectable()
export class RestaurantController {
    constructor(@inject(TOKENS.RestaurantService) private readonly restaurantService: RestaurantService) {}

    create = async(req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(CreateRestaurantDTO, req.body);
            const result = await this.restaurantService.createWithOwner(req.user?.role! as SystemRole, data);
            res.status(201).json({data: result});
        } catch (err) {
            next(err);
        }
    }
    
    getById = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const result = await this.restaurantService.findById(Number(req.params.restaurantId))
            sendSuccess(res, result);
        }catch (err) { next(err); }
    }

    getAll = async(req: Request, res: Response, next: NextFunction) => {
        try {
            // Gatekeeper: parse, cast ("25" -> 25, "1,2,3" -> [1, 2, 3]) and
            // validate all query params. Throws 400 on any invalid input.
            const query = await validateQuery(ListRestaurantsQueryDTO, req.query);
            const result = await this.restaurantService.findAll(query.toPaginationParams(), query.toFilterParams());
            sendPaginated(res, result.data, result.meta)
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