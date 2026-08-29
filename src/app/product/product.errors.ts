import { AppError } from "../../lib/error/appError";

export const productNotFoundError = new AppError("Product not found", 404); //not found