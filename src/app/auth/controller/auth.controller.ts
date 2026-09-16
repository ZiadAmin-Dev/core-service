import { RegisterDTO, LoginDTO, ForgetPasswordDTO, ResetPasswordDTO } from "../dto/auth.dto";
import { AuthService } from "../service/auth.service";
import { Request, Response, NextFunction } from "express";
import { validateBody } from "../../../lib/validation/validate";
import { setAccessTokenCookies, setAuthCookies} from "../auth.utils"
import { MissingRefreshTokenError } from "../auth.errors";
import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../../lib/di/tokens";
import { sendSuccess } from "../../../lib/http/response";

@injectable()
export class AuthController {
    constructor(@inject(TOKENS.AuthService) private readonly authService: AuthService) {}

    register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(RegisterDTO, req.body);
            const result = await this.authService.register(data);
            setAuthCookies(res, result.accessToken, result.refreshToken)
            sendSuccess(res, result, 201); //201 Created
        } catch (err) { next(err); }
    }

    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(LoginDTO, req.body);
            const result = await this.authService.login(data);
            setAuthCookies(res, result.accessToken, result.refreshToken)
            sendSuccess(res, result); //200 OK
        } catch (err) { next(err); }
    }

    forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(ForgetPasswordDTO, req.body);
            await this.authService.forgetPassword(data);
            sendSuccess(res, { message: "OTP sent to your email" }); //200 OK
        } catch (err) { next(err); }
    }

    resetPassword = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(ResetPasswordDTO, req.body);
            await this.authService.resetPassword(data);
            sendSuccess(res, { message: "Password reset successfully, Please login again" }); //200 OK
        } catch (err) { next(err); }
    }

    refresh = async (req: Request, res: Response, next: NextFunction) =>{
        try{
            const refreshToken = req.cookies.refresh_token;
            if (!refreshToken) throw MissingRefreshTokenError;
            const result = await this.authService.refresh(refreshToken);
            setAccessTokenCookies(res, result.accessToken);
            sendSuccess(res, { message: "success" });
        } catch(err){
            next(err)
        }
    }

    acceptInvite = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(ResetPasswordDTO, req.body);
            await this.authService.acceptInvite(data);
            sendSuccess(res, { message: "Invite accepted successfully, Please login again" });
        } catch (err) { next(err); }
    }
}