import { AppError } from "../../lib/error/appError";

export const notAuthenticatedError = new AppError("User not authenicated", 403);
export const notAuthorisedError = new AppError("User not authorised", 401);