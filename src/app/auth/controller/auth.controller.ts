import { RegisterDTO, LoginDTO, ForgetPasswordDTO, ResetPasswordDTO } from "../dto/auth.dto";
import { AuthService, authService } from "../service/auth.service";
import { Request, Response, NextFunction } from "express";
import { validateBody } from "../../../common/validation/validate";
import { setAccessTokenCookies, setAuthCookies} from "../auth.utils"
import { MissingRefreshTokenError } from "../auth.errors";

export class AuthController {
    constructor(private readonly authService: AuthService) {}

    register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(RegisterDTO, req.body);
            const result = await this.authService.register(data);
            setAuthCookies(res, result.accessToken, result.refreshToken)
            res.status(201).json(result); //201 Created
        } catch (err) { next(err); }
    }

    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(LoginDTO, req.body);
            const result = await this.authService.login(data);
            setAuthCookies(res, result.accessToken, result.refreshToken)
            res.status(200).json(result); //200 OK
        } catch (err) { next(err); }
    }

    forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(ForgetPasswordDTO, req.body);
            await this.authService.forgetPassword(data);
            res.status(200).json({message: "OTP sent to your email"}); //200 OK
        } catch (err) { next(err); }
    }

    resetPassword = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(ResetPasswordDTO, req.body);
            await this.authService.resetPassword(data);
            res.status(200).json({message: "Password reset succesfully, Please login again"}); //200 OK
        } catch (err) { next(err); }
    }

    refresh = async (req: Request, res: Response, next: NextFunction) =>{
        try{
            const refreshToken = req.cookies.refresh_token;
            if(!refreshToken) throw MissingRefreshTokenError
            const result = await this.authService.refresh(refreshToken)
            setAccessTokenCookies(res, result.accessToken)
            res.status(200).json({message:"success"})
        } catch(err){
            next(err)
        }
    }
}

export const authController = new AuthController(authService);