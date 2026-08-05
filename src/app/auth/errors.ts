import { AppError } from "../../common/error/appError";


export const userAlreadyExistsError = new AppError("User already exists", 400); //bad request
export const cannotSingUpAsSystemAdminError = new AppError("Cannot register as system admin", 403); //forbidden