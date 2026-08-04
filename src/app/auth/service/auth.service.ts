import { systemRole } from "../../user/entity/enums";
import { createUser, findUserExistsByEmailOrPhone } from "../../user/repository/users.repo";
import {registerDTO} from "../dto/auth.dto";
import { CannotSingUpAsSystemAdminError, UserAlreadyExistsError } from "../errors";
import { createAccessToken, createRefreshToken, hashPassword } from "../utils";

export class authService {
    register = async(data: registerDTO )=> {
        
        if(data.role == systemRole.SYSTEM_ADMIN){
            throw CannotSingUpAsSystemAdminError;
        }
        const existing: Boolean = await findUserExistsByEmailOrPhone(data.email, data.phone);

        if(existing){
            throw UserAlreadyExistsError;
        }

        const hashedPassword = await hashPassword(data.password);

        const now = new Date();
        const user = await createUser ({
            email: data.email,
            phone: data.phone,
            name: data.name,
            passwordHash: hashedPassword,
            systemRole: data.role,
            createdAt: now,
            updatedAt: now
        });

        
        const payload = {userId: user.id, role: data.role, email: user.email};
        const accessToken = createAccessToken(payload);
        const refreshToken = createRefreshToken(payload);

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                systemRole: user.systemRole,
            }
        }
    }
}

export const AuthService = new authService();