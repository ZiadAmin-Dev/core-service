import {userService, UserService} from "../service/user.service"
import { Request, Response, NextFunction } from "express";
import { UpdateProfileDTO } from "../dto/user.dto";
import { validateBody } from "../../../common/validation/validate";

export class UserController {
    constructor(private readonly userService: UserService) {}

    getMe = async (req: Request, res: Response, next: NextFunction) => {
        try {
            //1. validate the request params
            //2. call the service layer to get the user by id
            //3. return the response with user data
            const user = await this.userService.getByUserId(req.user?.userId!);
            res.status(200).json(user); //200 OK
        } catch (err) { next(err); }
    }

    updateProfile = async (req: Request, res: Response, next: NextFunction) => {
        try{
            const data = await validateBody(UpdateProfileDTO, req.body)
            const result = await this.userService.updateUserProfile(data, req.user?.userId!)
            res.status(200).json(result);
        } catch (err) { next(err); }
    }
}

export const userController = new UserController(userService)