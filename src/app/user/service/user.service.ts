import { findUserById, findUserExistsByPhone } from "../../user/repository/users.repo";
import { userNotFoundError, phoneAlreadyInUse } from "../user.errors"
import { SystemRole } from "../entity/enums";
import { UpdateProfileDTO } from "../dto/user.dto"
import { updateUserProfile } from "../repository/users.repo"
import { toUserResponse } from "../../../common/utils/utils";

export class UserService{
    
    getByUserId = async (userId: number): Promise<{ id: number; email: string, name: string, phone: string, systemRole: SystemRole }> =>{ 
        const user = await findUserById(userId)
        if(!user) throw userNotFoundError
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            systemRole: user.systemRole,
        }
    }

    updateUserProfile = async (data: UpdateProfileDTO, userId: number) =>{
        const user = await findUserById(userId);
        if(!user) throw userNotFoundError;
        if (data.phone) {
            const newPhoneExisting = await findUserExistsByPhone(data.phone);
            if (newPhoneExisting) throw phoneAlreadyInUse; }
        await updateUserProfile(userId, {
        name: data.name,
        phone: data.phone
    })
    const updatedUser = await findUserById(userId);
    if (!updatedUser) throw userNotFoundError;
    return {
        message: "Profile updated",
        user: toUserResponse(updatedUser)
    };
    }
}

export const userService = new UserService()