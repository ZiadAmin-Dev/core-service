import { AppError } from "../../lib/error/appError";

// Restaurant Member Errors
export const cannotCreateOwnerMember = new AppError("Not allowed to create another owner", 400); //bad request
export const memberNotFoundError = new AppError('Member not found', 404);
export const cannotDeleteOwnerError = new AppError('Cannot delete the restaurant owner', 400);
export const cannotAssignBranchesToOwners = new AppError('Cannot assign branches to owners, they have access to all branches', 400);

export const invalidBranchIdsError = new AppError('One or more branch IDs do not belong to this restaurant', 400);

// roles Errors
export const roleNotFoundError = new AppError("Role not found", 404); //not found


// permissons Errors
export const permissonsNotFoundError = new AppError("Role not found", 404); //not found
