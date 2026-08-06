import { RegisterDTO, LoginDTO, ForgetPasswordDTO, ResetPasswordDTO } from "../dto/auth.dto";
import { AuthService, authService } from "../service/auth.service";
import { Request, Response, NextFunction } from "express";
import { validateBody } from "../../../common/validation/validate";
import { hoursToMilliseconds, daysToMilliseconds} from "../../../common/utils/utils"
import { setAuthCookies} from "../auth.utils"

export class AuthController {
    constructor(private readonly authService: AuthService) {}

    register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            //1. validate the request body
            //2. call the service layer to register the user
            //3. return the response with access token, refresh token and user data
            const data = await validateBody(RegisterDTO, req.body);
            const result = await this.authService.register(data);

            setAuthCookies(res, result.accessToken, result.refreshToken)

            res.status(201).json(result); //201 Created
        } catch (err) {
            next(err);
        }
    }

    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            //1. validate the request body
            //2. call the service layer to login the user
            //3. return the response with access token, refresh token and user data
            const data = await validateBody(LoginDTO, req.body);
            const result = await this.authService.login(data);

            setAuthCookies(res, result.accessToken, result.refreshToken)

            res.status(200).json(result); //200 OK
        } catch (err) {
            next(err);
        } 
    }

    forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
        try{
            //1. validate the request body
            //2. call the service layer to send the OTP to the user's email
            //3. return the response with a message
            const data = await validateBody(ForgetPasswordDTO, req.body);
            await this.authService.forgetPassword(data);
            res.status(200).json({message: "OTP sent to your email"}); //200 OK
        } catch (err) {
            next(err);
        }
    }

    resetPassword = async (req: Request, res: Response, next: NextFunction) => {
        try{
            //1. validate the request body
            //2. call the service layer to send the OTP to the user's email
            //3. return the response with a message
            const data = await validateBody(ResetPasswordDTO, req.body);
            await this.authService.resetPassword(data);
            res.status(200).json({message: "Password reset succesfully, Please login again"}); //200 OK
        } catch (err) {
            next(err);
        }
    }
}

export const authController = new AuthController(authService);