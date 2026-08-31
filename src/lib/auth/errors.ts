import { AppError } from "../../lib/error/appError";

export const notAuthenticatedError = new AppError("User not authenicated", 403);
export const notAuthorisedError = new AppError("User not authorised", 401);
export const invalidOrMissingError = new AppError("Invalid or missing restaurant ID parameter", 400);
export const restaurantAccessRestrictedError = new AppError("Permission denied: Access to this restaurant is restricted", 403);
export const branchAccessRestrictedError = new AppError("Permission denied: Access to this branch is restricted", 403);
export const hasnotThisPermissionError = new AppError("Permission denied: Has not this permission", 403);
