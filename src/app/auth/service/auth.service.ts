import { SystemRole } from "../../user/entity/enums";
import { createUser, findUserExistsByEmailOrPhone, findUserByEmail, findUserExistsByEmail, updateUserPassword, findUserById } from "../../user/repository/users.repo";
import { LoginDTO, RegisterDTO, ForgetPasswordDTO, ResetPasswordDTO } from "../dto/auth.dto";
import { cannotSingUpAsSystemAdminError, userAlreadyExistsError, incorrectCredentialsError, InvalidOTPError, userNotFoundError } from "../auth.errors";
import { updatePasswordResetConsumedAt, createPasswordReset, findLatestPasswordResetByUserId } from "../repository/password-reset.repo";
import { comparePassword, createAccessToken, createAuthTokens, createRefreshToken, GenerateOTP, hashOTP, hashPassword, verifyRefreshToken } from "../auth.utils";
import { toUserResponse} from "../../../common/utils/utils"
import { toMs } from "../../../common/utils/time";

export class AuthService {

    register = async(data: RegisterDTO )=> {
        
        if(data.role == SystemRole.SYSTEM_ADMIN) throw cannotSingUpAsSystemAdminError;
        const existing: Boolean = await findUserExistsByEmailOrPhone(data.email, data.phone);
        if(existing) throw userAlreadyExistsError
        const hashedPassword = await hashPassword(data.password);
        const user = await createUser ({
            email: data.email,
            phone: data.phone,
            name: data.name,
            passwordHash: hashedPassword,
            systemRole: data.role,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        const payload = { userId: user.id, email: user.email, role: data.role };
        const tokens = createAuthTokens(payload);
        return {
            message: "User registered successfully",
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: toUserResponse(user)
        }
    }

    login = async(data: LoginDTO )=> {
        const user = await findUserByEmail(data.email);
        if (!user) throw incorrectCredentialsError;
        const isMatch = await comparePassword(data.password, user.passwordHash);
        if (!isMatch) throw incorrectCredentialsError;
        const payload = {userId: user.id, role: user.systemRole, email: user.email};
        const tokens = createAuthTokens(payload);
        return {
            message: "User logged in successfully",
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: toUserResponse(user)
        }
    }

    forgetPassword = async(data: ForgetPasswordDTO )=> {
        const user = await findUserByEmail(data.email);
        if (!user) return
        const otp = GenerateOTP();
        const hashedOTP = hashOTP(otp);
        await createPasswordReset({
            userId: user.id,
            otpHash: hashedOTP,
            expiresAt: new Date(Date.now() + toMs(10,'m')), // 10 minutes from now
            createdAt: new Date(),
        });

        // TODO: send the OTP to the user's email
        console.log(`mocked email sent to "${user.email}" with OTP: ${otp}`);
        
    }

    resetPassword = async(data: ResetPasswordDTO) =>{
        const user = await findUserByEmail(data.email);
        if (!user) throw InvalidOTPError;
        const reset = await findLatestPasswordResetByUserId(user.id);
        if (!reset) throw InvalidOTPError;
        const inputOTPHash = hashOTP(data.otp);
        if(inputOTPHash != reset.otpHash || reset.isExpired()){
            throw InvalidOTPError;
        }
        const newHashPassowrd = await hashPassword(data.newPassword);
        await updateUserPassword(user.id, newHashPassowrd);
        await updatePasswordResetConsumedAt(reset.id);
    }

    refresh = async(refreshToken: string) => {
        if (!refreshToken) throw incorrectCredentialsError;
        const payload = verifyRefreshToken(refreshToken)
        const accessToken = createAccessToken({ userId: payload.userId, email: payload.email, role: payload.role, });
        return { accessToken };
    }
}

export const authService = new AuthService();