import { SystemRole } from "../../user/entity/enums";
import { createUser, findUserExistsByEmailOrPhone, findUserByEmail, updateUserPassword, } from "../../user/repository/users.repo";
import { LoginDTO, RegisterDTO, ForgetPasswordDTO, ResetPasswordDTO } from "../dto/auth.dto";
import { cannotSingUpAsSystemAdminError, userAlreadyExistsError, incorrectCredentialsError, InvalidOTPError, userNotFoundError, restaurantDataIsRequiredError } from "../auth.errors";
import { updatePasswordResetConsumedAt, createPasswordReset, findLatestPasswordResetByUserId } from "../repository/password-reset.repo";
import { comparePassword, createAccessToken, createAuthTokens, GenerateOTP, hashOTP, hashPassword, verifyRefreshToken } from "../auth.utils";
import { toUserResponse} from "../../../common/utils/utils"
import { toMs } from "../../../common/utils/time";
import { RestaurantService, restaurantService} from "../../restaurant/service/restaurant.service";
import { db } from "../../../common/knex/knex";

export class AuthService {

    constructor(private readonly restaurantService: RestaurantService){}

    register = async(data: RegisterDTO )=> {
        
        if(data.role == SystemRole.SYSTEM_ADMIN) throw cannotSingUpAsSystemAdminError;
        const existing = await findUserExistsByEmailOrPhone(data.email, data.phone);
        if(existing) throw userAlreadyExistsError;
        const hashedPassword = await hashPassword(data.password);
        
        const trx = await db.transaction();
        let user;
        let restaurant;
        try{
            user = await createUser ({
                email: data.email,
                phone: data.phone,
                name: data.name,
                passwordHash: hashedPassword,
                systemRole: data.role,
                createdAt: new Date(),
                updatedAt: new Date()
            }, trx);

            if(data.role == SystemRole.RESTAURANT_USER) {
                if(data.restaurant == undefined) throw restaurantDataIsRequiredError;
                restaurant = await this.restaurantService.create(user.id, data.restaurant, trx);
            }
            await trx.commit();
        } catch(err) {
            await trx.rollback()
            throw err }

        const payload = { userId: user.id, email: user.email, role: data.role };
        const tokens = createAuthTokens(payload);
        return {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: toUserResponse(user),
            restaurant
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

export const authService = new AuthService(restaurantService);