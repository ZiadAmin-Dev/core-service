import { appError } from "../../common/error/appError";


export const UserAlreadyExistsError = new appError("User already exists", 400); //bad request
export const CannotSingUpAsSystemAdminError = new appError("Cannot register as system admin", 403); //forbidden