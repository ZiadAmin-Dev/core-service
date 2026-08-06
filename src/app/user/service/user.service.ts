import {findUserById} from "../../user/repository/users.repo";
import {userNotFoundError } from "../user.errors"
import { SystemRole } from "../entity/enums";

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
}

export const userService = new UserService()