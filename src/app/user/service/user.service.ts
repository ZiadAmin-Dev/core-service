import { findUserById, findUserExistsByPhone } from "../../user/repository/users.repo";
import { userNotFoundError, phoneAlreadyInUse } from "../user.errors"
import { UpdateUserDTO } from "../dto/user.dto"
import { updateUserProfile } from "../repository/users.repo"
import { toUserResponse } from "../../../common/utils/utils";

export class UserService{
    
    getByUserId = async (userId: number) =>{ 
        const user = await findUserById(userId)
        if(!user) throw userNotFoundError
        return toUserResponse(user);
    }

    updateProfile = async (data: UpdateUserDTO, userId: number) => {
        const user = await findUserById(userId);
        if(!user) throw userNotFoundError;
        if (data.phone) {
            const newPhoneExisting = await findUserExistsByPhone(data.phone);
            if (newPhoneExisting) throw phoneAlreadyInUse; }
        const updated = await updateUserProfile(userId, data)
        return toUserResponse(updated);
    }
}

export const userService = new UserService()