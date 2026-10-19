import { UserService } from "../service/user.service"
import { Request, Response, NextFunction } from "express";
import { UpdateUserDTO } from "../dto/user.request.dto";
import { validateBody } from "../../../lib/validation/validate";
import { inject, injectable } from "tsyringe";
import { TOKENS } from "../../../lib/di/tokens";
import { sendSuccess } from "../../../lib/http/response";

@injectable()
export class UserController {
    constructor(@inject(TOKENS.UserService) private readonly userService: UserService) {}

    getMe = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await this.userService.getByUserId(req.user?.userId!);
            res.status(200).json(user); //200 OK
        } catch (err) { next(err); }
    }

    updateMe = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await validateBody(UpdateUserDTO, req.body);
            const user = await this.userService.updateProfile(data, req.user?.userId!);
            res.status(200).json({ message: "Profile updated", user });
        } catch (err) { next(err); }
    }

    getAgentById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const agent = await this.userService.getAgentById(Number(req.params.id));
            sendSuccess(res, agent);
        } catch (err) {
            next(err);
        }
    }
}