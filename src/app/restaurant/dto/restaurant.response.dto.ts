import { RestaurantStatus } from "../entity/enums";
import { Restaurant } from "../entity/restaurant.entity";

// Response DTOs — shapes returned by RestaurantService via RestaurantController
// (see DOCS/restaurant.md).

export class RestaurantResponseDTO {
    id!: number;
    ownerId!: number;
    name!: string;
    logoURL!: string;
    status!: RestaurantStatus;
    statusUpdatedAt!: Date;
    primaryCountry!: string;
    createdAt!: Date;
    updatedAt!: Date;

    static from(restaurant: Restaurant): RestaurantResponseDTO {
        return {
            id: restaurant.id,
            ownerId: restaurant.ownerId,
            name: restaurant.name,
            logoURL: restaurant.logoURL,
            status: restaurant.status,
            statusUpdatedAt: restaurant.statusUpdatedAt,
            primaryCountry: restaurant.primaryCountry,
            createdAt: restaurant.createdAt,
            updatedAt: restaurant.updatedAt,
        };
    }
}

export class RestaurantOwnerResponseDTO {
    id!: number;
    email!: string;
    phone!: string;
    name!: string;
    systemRole!: string;

    static from(owner: RestaurantOwnerResponseDTO): RestaurantOwnerResponseDTO {
        return {
            id: owner.id,
            email: owner.email,
            phone: owner.phone,
            name: owner.name,
            systemRole: owner.systemRole,
        };
    }
}

export class CreateRestaurantWithOwnerResponseDTO {
    restaurant!: RestaurantResponseDTO;
    owner!: RestaurantOwnerResponseDTO;

    static from(restaurant: Restaurant, owner: RestaurantOwnerResponseDTO): CreateRestaurantWithOwnerResponseDTO {
        return {
            restaurant: RestaurantResponseDTO.from(restaurant),
            owner: RestaurantOwnerResponseDTO.from(owner),
        };
    }
}

export class RestaurantStatusResponseDTO {
    id!: number;
    name!: string;
    status!: RestaurantStatus;

    static from(restaurant: Restaurant): RestaurantStatusResponseDTO {
        return {
            id: restaurant.id,
            name: restaurant.name,
            status: restaurant.status,
        };
    }
}
