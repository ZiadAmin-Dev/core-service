import { AppError } from "../../common/error/appError";

export const notAuthenticated = new AppError("User not authenicated", 403);