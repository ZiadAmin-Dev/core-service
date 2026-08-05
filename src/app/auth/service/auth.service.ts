import { SystemRole } from "../../user/entity/enums";
import { createUser, findUserExistsByEmailOrPhone } from "../../user/repository/users.repo";
import { RegisterDTO } from "../dto/auth.dto";
import { cannotSingUpAsSystemAdminError, userAlreadyExistsError } from "../errors";
import { createAccessToken, createRefreshToken, hashPassword } from "../utils";

export class AuthService {
    register = async(data: RegisterDTO )=> {
        
        if(data.role == SystemRole.SYSTEM_ADMIN){
            throw cannotSingUpAsSystemAdminError;
        }

        const existing: Boolean = await findUserExistsByEmailOrPhone(data.email, data.phone);

        if(existing){
            throw userAlreadyExistsError;
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

export const authService = new AuthService();