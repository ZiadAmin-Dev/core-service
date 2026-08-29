import { AppError } from "../../lib/error/appError";

export const branchNotFoundError = new AppError("branch not found", 404); //not found