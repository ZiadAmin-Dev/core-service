import { Knex } from "knex";
import { RegisterRestaurantDTO } from "../../auth/dto/auth.dto";
import { RestaurantStatus } from "../entity/enums";
import { Restaurant } from "../entity/restaurant.entity";
import { createRestaurant, findRestaurantsByStatus, findAllRestaurants, findRestaurantById, updateRestaurant, updateRestaurantStatus } from "../repository/restaurant.repo";
import { restaurantNotFoundError } from "../resraurant.errors";
import { UpdateRestaurantDTO } from "../dto/restaurant.dto";
import { SystemRole } from "../../user/entity/enums";
import { notAuthorisedError } from "../../../common/auth/errors";


export class RestaurantService {

    findById = async (id: number): Promise<Restaurant> => {
        const restaurant = await findRestaurantById(id);
        if (!restaurant) throw restaurantNotFoundError;
        return restaurant;
    }

    findAll = () => findAllRestaurants();

    findActive = () => findRestaurantsByStatus(RestaurantStatus.ACTIVE);

    findDisabled = () => findRestaurantsByStatus(RestaurantStatus.DISABLED);

    findSuspended = () => findRestaurantsByStatus(RestaurantStatus.SUSPENDED);

    findPending = () => findRestaurantsByStatus(RestaurantStatus.PENDING);

    create = async(userId: number, data: RegisterRestaurantDTO, trx: Knex) => {
        const restaurant = await createRestaurant(new Restaurant({
            ownerId: userId,
            ...data,
            status: RestaurantStatus.PENDING,
            statusUpdatedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()}), 
            trx);
        return restaurant;
    }

    update = async( id:number, data: UpdateRestaurantDTO) =>{
        const restaurant = await findRestaurantById(id);
        if (!restaurant) throw restaurantNotFoundError;
        const updated = await updateRestaurant(id, data)
        return {
            restaurant : updated
        }
    }

    updateStatus = async (id: number, userRole: string, status: RestaurantStatus) => {
        if (userRole !== SystemRole.SYSTEM_ADMIN) throw notAuthorisedError;
        const restaurant = await findRestaurantById(id);
        if (!restaurant) throw restaurantNotFoundError;

        return updateRestaurantStatus(id, status);
    };
}

export const restaurantService = new RestaurantService()