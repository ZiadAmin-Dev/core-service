import { notAuthorisedError } from "../../../common/auth/errors";
import { findRestaurantById } from "../../restaurant/repository/restaurant.repo";
import { SystemRole } from "../../user/entity/enums";
import { CreateBranchDTO } from "../dto/branch.dto";
import { Branch } from "../entity/branch.entity";
import { createBranch, findNearbyBranches } from "../repository/branch.repo"


export class BranchService{

    findNearby = async (lat: number, lng: number) => {
        const rows = await findNearbyBranches(lat, lng);
        return rows;
    }

    create = async (restaurantId: number, userId:number, userRole: SystemRole, data: CreateBranchDTO) =>{
        const restaurant = await findRestaurantById(restaurantId);
        if(userRole != SystemRole.SYSTEM_ADMIN && (Number(restaurant.ownerId) !== Number(userId))) {

            throw notAuthorisedError;

        }
        const branch = await createBranch(({
            restaurantId: restaurantId,
            countryCode: data.countryCode,
            addressText: data.addressText,
            label: data.label,
            lat: data.lat,
            lng: data.lng,
            isActive: false,
            opensAt: data.opensAt,
            closesAt: data.closesAt,
            acceptOrders: true,
            deliveryRadius: data.deliveryRadius,
            currency: data.currency,
            commission: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        }));
        return branch;
    } 
}

export const branchService = new BranchService()