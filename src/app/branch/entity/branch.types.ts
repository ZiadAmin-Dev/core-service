import {Branch} from "./branch.entity";

export interface BranchWithRestaurant {
    branch: Branch;
    restaurantStatus: string;
}