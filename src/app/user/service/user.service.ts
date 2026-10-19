import { createUser as createUserRepo, findUserById, findUserExistsByEmailOrPhone, findUserExistsByPhone } from "../../user/repository/users.repo";
import { userNotFoundError, phoneAlreadyInUse } from "../user.errors"
import { UpdateUserDTO } from "../dto/user.request.dto"
import { updateUserProfile } from "../repository/users.repo"
import { toUserResponse } from "../../../lib/utils/utils";
import { SystemRole } from "../user.enums";
import { Knex } from "knex";
import {User} from "../entity/user.entity";
import { userAlreadyExistsError } from "../../auth/auth.errors";
import { hashPassword } from "../../auth/auth.utils";
import { injectable } from "tsyringe";

export interface CreateUserData {
    email: string;
    phone: string;
    name: string;
    password: string;
    systemRole: SystemRole;
}

@injectable()
export class UserService{
    
    create = async (data: CreateUserData, trx?: Knex | Knex.Transaction) => {
        const existing = await findUserExistsByEmailOrPhone(data.email, data.phone);
        if (existing) throw userAlreadyExistsError;

        const hashedPassword = data.password ? await hashPassword(data.password) : '';
        const now = new Date();
        return createUserRepo({
            email: data.email,
            phone: data.phone,
            name: data.name,
            passwordHash: hashedPassword,
            systemRole: data.systemRole,
            createdAt: now,
            updatedAt: now,
        }, trx);

    }

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

    getAgentById = async (id: number) => {
        const user = await findUserById(id);
        if (!user) throw userNotFoundError;
        if (user.systemRole !== SystemRole.DELIVERY_AGENT) {
            // Use userNotFoundError to avoid enumeration of other user types.
            throw userNotFoundError;
        }
        return {id: user.id, name: user.name, phone: user.phone};
    }
}