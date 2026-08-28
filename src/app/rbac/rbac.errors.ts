import { AppError } from "../../common/error/appError";

// Restaurant Member Errors
export const cannotCreateOwnerMember = new AppError("Not allowed to create another owner", 400); //bad request


// roles Errors
export const roleNotFoundError = new AppError("Role not found", 404); //not found