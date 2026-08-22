import { AppError } from "../../common/error/appError";

export const restaurantNotFoundError = new AppError("restaurant not found", 404); //not found