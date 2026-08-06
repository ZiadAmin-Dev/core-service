import { SystemRole } from "../../user/entity/enums";
import { createUser, findUserExistsByEmailOrPhone, findUserByEmail, findUserExistsByEmail, updateUserPassword } from "../../user/repository/users.repo";
import { LoginDTO, RegisterDTO, ForgetPasswordDTO, ResetPasswordDTO } from "../dto/auth.dto";
import { cannotSingUpAsSystemAdminError, userAlreadyExistsError, incorrectCredentialsError, InvalidOTPError } from "../auth.errors";
import { consumePasswordReset, createPasswordReset, findLatestPasswordResetByUserId } from "../repository/password-reset.repo";
import { comparePassword, createAccessToken, createRefreshToken, GenerateOTP, hashOTP, hashPassword } from "../auth.utils";
import {mintuesToMilliseconds} from "../../../common/utils/utils"

export class AuthService {
    register = async(data: RegisterDTO )=> {
        
        if(data.role == SystemRole.SYSTEM_ADMIN) throw cannotSingUpAsSystemAdminError;
        const existing: Boolean = await findUserExistsByEmailOrPhone(data.email, data.phone);
        if(existing) throw userAlreadyExistsError
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
            message: "User registered successfully",
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                name: user.name,
                systemRole: user.systemRole,
                createdAt: user.createdAt,
            }
        }
    }

    login = async(data: LoginDTO )=> {
        // find user by email
        const user = await findUserByEmail(data.email);
        if (!user) throw incorrectCredentialsError;

        // compare password
        // if password does not match, throw an error
        const isMatch = await comparePassword(data.password, user.passwordHash);
        if (!isMatch) throw incorrectCredentialsError;
        // else if password matches, create access token and refresh token
        const payload = {userId: user.id, role: user.systemRole, email: user.email};
        const accessToken = createAccessToken(payload);
        const refreshToken = createRefreshToken(payload);
        // return access token and refresh token
        return {
            message: "User logged in successfully",
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                phone: user.phone,
                name: user.name,
                systemRole: user.systemRole,
                createdAt: user.createdAt,
            }
        }

    }

    forgetPassword = async(data: ForgetPasswordDTO )=> {
        // find user by email
        const user = await findUserByEmail(data.email);
        // if user does not exist, throw an error
        if (!user) return
        // else generate a random OTP
        const otp = GenerateOTP();
        // hash the OTP and save it in the database with an expiry time of 5 minutes
        const hashedOTP = hashOTP(otp);
        //insert the hashed OTP and expiry time in the database for the user
        await createPasswordReset({
            userId: user.id,
            otpHash: hashedOTP,
            expiresAt: new Date(Date.now() + mintuesToMilliseconds(10)), // 10 minutes from now
            createdAt: new Date(),
        });

        // TODO: send the OTP to the user's email
        console.log(`mocked email sent to "${user.email}" with OTP: ${otp}`);
        
    }

    resetPassword = async(data: ResetPasswordDTO) =>{
        // find user by email
        const user = await findUserByEmail(data.email);
        // if user does not exist, throw an error
        if (!user) throw InvalidOTPError;
        // find reset password
        const reset = await findLatestPasswordResetByUserId(user.id);
        if (!reset) throw InvalidOTPError;
        //verify otp and expire its date
        const inputOTPHash = hashOTP(data.otp);
        if(inputOTPHash != reset.otpHash || reset.isExpired()){
            throw InvalidOTPError;
        }
        //update user password
        const newHashPassowrd = await hashPassword(data.newPassword);
        await updateUserPassword(user.id, newHashPassowrd);
        //update reset password
        await consumePasswordReset(reset.id);
    }
}

export const authService = new AuthService();