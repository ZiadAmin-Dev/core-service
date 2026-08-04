import { registerDTO } from "../dto/auth.dto";
import {AuthService, authService} from "../service/auth.service";
import {Request, Response, NextFunction} from "express";
import { validateBody } from "../../../common/validation/validate";

export class authController {
    constructor(private readonly authService: authService) {}

    register = async (req: Request, res: Response, next: NextFunction) => {
        try {
            //1. validate the request body
            //2. call the service layer to register the user
            //3. return the response with access token, refresh token and user data
            const data = await validateBody(registerDTO, req.body);
            const result = await this.authService.register(data);
            res.status(201).json(result);
        } catch (err) {
            next(err);
        }
    }
}

export const AuthController = new authController(AuthService);