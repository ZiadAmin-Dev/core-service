import { notAuthorisedError } from "../../../common/auth/errors";
import { findRestaurantById } from "../../restaurant/repository/restaurant.repo";
import { restaurantNotFoundError } from "../../restaurant/resraurant.errors";
import { SystemRole } from "../../user/entity/enums";
import { branchNotFoundError } from "../branch.errors";
import { CreateBranchDTO, UpdateBranchDTO, UpdateBranchStatusDTO } from "../dto/branch.dto";
import { Branch } from "../entity/branch.entity";
import { createBranch, findActiveBranchesByRestaurantId, findBranchById, findBranchesByRestaurantId, findNearbyBranches, updateBranch, updateBranchStatus } from "../repository/branch.repo"


export class BranchService{

    findNearby = async (lat: number, lng: number) => {
        const rows = await findNearbyBranches(lat, lng);
        return rows;
    }

    findByRestaurant = (restaurantId: number) => findBranchesByRestaurantId(restaurantId);

    findActiveByRestaurant = (restaurantId: number) => findActiveBranchesByRestaurantId(restaurantId);

    create = async (restaurantId: number, userId:number, userRole: SystemRole, data: CreateBranchDTO) =>{
        const restaurant = await findRestaurantById(restaurantId);
        if(!restaurant) throw restaurantNotFoundError
        if(userRole != SystemRole.SYSTEM_ADMIN && (Number(restaurant.ownerId) !== Number(userId))) throw notAuthorisedError;
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

    update = async (id: number, userId: number, userRole: SystemRole, data: UpdateBranchDTO) =>{
        const branch = await findBranchById(id);
        if(!branch) throw branchNotFoundError;
        const restaurant = await findRestaurantById(branch.restaurantId);
        if(!restaurant) throw restaurantNotFoundError;
        if(userRole != SystemRole.SYSTEM_ADMIN && (Number(restaurant.ownerId) !== Number(userId))) throw notAuthorisedError;
        const updated = await updateBranch(id,data);
        return updated;
    }

    updateStatus = async (id: number, userRole: SystemRole, data: UpdateBranchStatusDTO) => {
    if (userRole !== SystemRole.SYSTEM_ADMIN) throw notAuthorisedError;

    const branch = await findBranchById(id);
    if (!branch) throw branchNotFoundError;

    return updateBranchStatus(id, data);
};
}

export const branchService = new BranchService()