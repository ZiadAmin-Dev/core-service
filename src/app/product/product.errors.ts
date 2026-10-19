import { AppError } from "../../lib/error/appError";

export const productNotFoundError = new AppError("Product not found", 404); //not found
export const missingProductIdsQueryError = new AppError("Missing product ids query parameter", 400); //bad request
export const invalidReserveItemsError = new AppError("Invalid reserve items", 400); //bad request

export function outOfStockError(offending: unknown) {
    return new AppError(`OutOfStock: ${JSON.stringify(offending)}`, 409);
}
