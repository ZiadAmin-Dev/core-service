import {userService, UserService} from "../service/user.service"
import { Request, Response, NextFunction } from "express";
import { UpdateUserDTO } from "../dto/user.dto";
import { validateBody } from "../../../common/validation/validate";

export class UserController {
    constructor(private readonly userService: UserService) {}

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
}

export const userController = new UserController(userService)