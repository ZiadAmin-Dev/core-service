import { AppError } from "../../common/error/appError";

export const addressNotFoundError = new AppError("Address not found", 404); //not found