import { AppError } from "../../common/error/appError";


export const userAlreadyExistsError = new AppError("User already exists", 400); //bad request
export const cannotSingUpAsSystemAdminError = new AppError("Cannot register as system admin", 403); //forbidden
export const incorrectCredentialsError = new AppError("Incorrect email or password", 401); //unauthorized
export const userNotFoundError = new AppError("User not found", 404); //not found
export const InvalidOTPError = new AppError("Invalid OTP", 400);
export const MissingRefreshTokenError = new AppError ("Missing refresh token", 401) //unauthorized
export const restaurantDataIsRequiredError = new AppError ("Restaurant data is required", 400) //unauthorized