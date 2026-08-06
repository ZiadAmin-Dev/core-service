import {userService, UserService} from "../service/user.service"
import { Request, Response, NextFunction } from "express";

export class UserController {
    constructor(private readonly userService: UserService) {}

    getMe = async (req: Request, res: Response, next: NextFunction) => {
        try {
            //1. validate the request params
            //2. call the service layer to get the user by id
            //3. return the response with user data
            const user = await this.userService.getByUserId(Number(req.user?.userId!));
            res.status(200).json(user); //200 OK
        } catch (err) {
            next(err);
        }
    }
}

export const userController = new UserController(userService)