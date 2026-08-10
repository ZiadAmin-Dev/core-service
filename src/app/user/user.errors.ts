import { AppError } from "../../common/error/appError";

export const userNotFoundError = new AppError("User not found", 404); //not found
export const phoneAlreadyInUse = new AppError("Phone Already in use", 401); 