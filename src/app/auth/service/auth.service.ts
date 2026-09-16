import { SystemRole } from "../../user/user.enums";
import { findUserExistsByEmailOrPhone, findUserByEmail, updateUserPassword, } from "../../user/repository/users.repo";
import { LoginDTO, RegisterDTO, ForgetPasswordDTO, ResetPasswordDTO } from "../dto/auth.dto";
import { cannotSingUpAsSystemAdminError, userAlreadyExistsError, incorrectCredentialsError, InvalidOTPError, restaurantDataIsRequiredError } from "../auth.errors";
import { updatePasswordResetConsumedAt, createPasswordReset, findLatestPasswordResetByUserId } from "../repository/password-reset.repo";
import { comparePassword, createAccessToken, createAuthTokens, generateOTP, hashOTP, hashPassword, verifyRefreshToken } from "../auth.utils";
import { toUserResponse} from "../../../lib/utils/utils"
import { toMs } from "../../../pkg/utils/time";
import { RestaurantService } from "../../restaurant/service/restaurant.service";
import { db } from "../../../lib/knex/knex";
import { activateMemberByUserId, createRestaurantMember, findRestaurantMemberWithRole } from "../../rbac/repository/restaurant-member.repo";
import { findBranchIdsByMemberId } from "../../rbac/repository/member-branch.repo";
import { memberNotFoundError } from "../../rbac/rbac.errors";
import { UserService } from "../../user/service/user.service";
import { MemberService } from "../../rbac/service/member.service";
import { inject, injectable } from "tsyringe";
import { TOKENS } from "../../../lib/di/tokens";
import { passwordResetEmail } from "../templates/password-reset";
import { IEmailProvider } from "../../../pkg/email/email.interface";

@injectable()
export class AuthService {

    constructor(
        @inject(TOKENS.RestaurantService)private readonly restaurantService: RestaurantService,
        @inject(TOKENS.UserService)private readonly userService: UserService,
        @inject(TOKENS.MemberService) private readonly memberService: MemberService,
        @inject(TOKENS.EmailProvider) private readonly emailProvider: IEmailProvider,
    ){}

    register = async (data: RegisterDTO) => {
        // 1. Initial validations (executed outside the transaction to save resources)
        if (data.role === SystemRole.SYSTEM_ADMIN) throw cannotSingUpAsSystemAdminError;

        const existing = await findUserExistsByEmailOrPhone(data.email, data.phone);
        if (existing) throw userAlreadyExistsError;

        const hashedPassword = await hashPassword(data.password);

        let user: any; // Explicit type or User entity interface
        let restaurant: any;
        let restaurantMemberInfo: any = {};

        // 2. Execute database operations within a managed transaction
        await db.transaction(async (trx) => {
            const now = new Date();

            // Create base user record
            user = await this.userService.create({
                email: data.email,
                phone: data.phone,
                name: data.name,
                password: hashedPassword,
                systemRole: data.role,
            }, trx);

            // Handle restaurant user specifics
            if (data.role === SystemRole.RESTAURANT_USER) {
                if (!data.restaurant) throw restaurantDataIsRequiredError;

                // Create restaurant entity
                restaurant = await this.restaurantService.create(user.id, data.restaurant, trx);

                // insert the owner member via member service
                await this.memberService.createOwnerMember(restaurant.id, user.id, trx);

                // Populate member info directly for the JWT payload
                restaurantMemberInfo = {
                    restaurantId: restaurant.id,
                    restaurantRole: 'owner',
                    branchIds: []
                };
            }
        });

        // ⚡ Guard check to satisfy TypeScript & catch unexpected failures
        if (!user) {
            throw new Error("Failed to create user during registration process.");
        }

        // 3. Generate tokens and prepare response after successful transaction commit
        const payload = { userId: user.id, email: user.email, role: user.systemRole, ...restaurantMemberInfo };
        const tokens = createAuthTokens(payload);

        return {
            message: "User registered successfully",
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: toUserResponse(user),
            restaurant
        };
    }

    login = async(data: LoginDTO )=> {
        const user = await findUserByEmail(data.email);
        if (!user) throw incorrectCredentialsError; //for security, we don't reveal if the email exists or not
        const isMatch = await comparePassword(data.password, user.passwordHash);
        if (!isMatch) throw incorrectCredentialsError; //for security, we don't reveal if the password is correct or not

        let restaurantMemberInfo = null;
        if(user.systemRole == SystemRole.RESTAURANT_USER){
            const memberData = await findRestaurantMemberWithRole(user.id);
            if (!memberData) {
            throw memberNotFoundError; 
        }
            if (memberData) {
                const branchIds = await findBranchIdsByMemberId(memberData.member.id);
                restaurantMemberInfo = {
                    restaurantId: memberData.member.restaurantId,
                    restaurantRole: memberData.roleName,
                    branchIds
                }
            }
        }

        const payload = {userId: user.id, role: user.systemRole, email: user.email, ...restaurantMemberInfo};
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
        if (!user) return; // For security, we don't reveal if the email exists
        const otp = generateOTP();
        const hashedOTP = hashOTP(otp);
        await createPasswordReset({
            userId: user.id,
            otpHash: hashedOTP,
            expiresAt: new Date(Date.now() + toMs(10,'m')), // 10 minutes from now
            createdAt: new Date(),
        });

        const email = passwordResetEmail(otp);
        await this.emailProvider.send(user.email, email.subject, email.html);        
    }

    resetPassword = async (data: ResetPasswordDTO) => {
        
        const user = await findUserByEmail(data.email);
        if (!user) throw InvalidOTPError;

        const reset = await findLatestPasswordResetByUserId(user.id);
        if (!reset) throw InvalidOTPError;

        const inputOTPHash = hashOTP(data.otp);
        if (inputOTPHash != reset.otpHash || reset.isExpired()) throw InvalidOTPError;
        
        const newHashPassowrd = await hashPassword(data.newPassword);

        await updateUserPassword(user.id, newHashPassowrd);
        await updatePasswordResetConsumedAt(reset.id);
        
        return user;
    }

    refresh = async(refreshToken: string) => {
        if (!refreshToken) throw incorrectCredentialsError;
        const payload = verifyRefreshToken(refreshToken)
        const accessToken = createAccessToken({ userId: payload.userId, email: payload.email, role: payload.role });
        return { accessToken };
    }

    acceptInvite = async(data: ResetPasswordDTO) =>{
        const user = await this.resetPassword(data);
        await activateMemberByUserId(user.id);
    }
}