import { Knex } from "knex";
import { RegisterRestaurantDTO } from "../../auth/dto/auth.dto";
import { RestaurantStatus } from "../entity/enums";
import { Restaurant } from "../entity/restaurant.entity";
import { createRestaurant, findActiveRestaurants, findAllRestaurants } from "../repository/restaurant.repo";



export class RestaurantService{

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


    findAll = async() =>{
        const result = await findAllRestaurants();
        return result
    }

    findActive = async() =>{
        const result = await findActiveRestaurants();
        return result
    }

}

export const restaurantService = new RestaurantService()