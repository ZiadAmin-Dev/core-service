import { db } from "../../../lib/knex/knex";
import { toMs } from "../../../lib/utils/time";
import { toUserResponse } from "../../../lib/utils/utils";
import { userAlreadyExistsError } from "../../auth/auth.errors";
import { generateOTP, hashOTP } from "../../auth/auth.utils";
import { createPasswordReset } from "../../auth/repository/password-reset.repo";
import { createUser, findUserExistsByEmail, findUserExistsByEmailOrPhone, findUserExistsByPhone } from "../../user/repository/users.repo";
import { SystemRole } from "../../user/user.enums";
import { CreateMemberDTO } from "../dto/member.dto";
import { MemberBranch } from "../entity/member-branch.entity";
import { MemberStatus } from "../member.enums";
import { cannotCreateOwnerMember, roleNotFoundError } from "../rbac.errors";
import { setMemberBranches } from "../repository/member-branch.repo";
import { createRestaurantMember } from "../repository/restaurant-member.repo";
import { findRoleByName } from "../repository/role.repo";

export class MemberService {

    async createMember(restaurantId: number, data: CreateMemberDTO) {
        if(data.role == 'owner') throw cannotCreateOwnerMember;

        const existingUser = await findUserExistsByEmailOrPhone(data.email, data.phoneNumber);
        if (existingUser) throw userAlreadyExistsError;
        
        const roleId = await findRoleByName(data.role);
        if(!roleId) throw roleNotFoundError;

        const result = await db.transaction(async (trx) => { 
            const now = new Date();
            const user = await createUser({
                email: data.email,
                name: data.name,
                phone: data.phoneNumber,
                passwordHash: '',
                systemRole: SystemRole.RESTAURANT_USER,
                createdAt: now,
                updatedAt: now,
            }, trx);

            const member = await createRestaurantMember(
                {
                    restaurantId,
                    userId: user.id,
                    roleId,
                    createdAt: now,
                    updatedAt: now,
                    status: MemberStatus.INACTIVE
                }, trx
            )

            const rows = data.branchIds.map(branchId => new MemberBranch({
                branchId: branchId,
                memberId: member.id,
                createdAt: now,
            }))

            await setMemberBranches(member.id, rows, trx)

            // generate otp, create password reset record and send email
            // generate an otp
            const otp = generateOTP();
            // hash the otp
            const hashedOtp = hashOTP(otp);
            // insert the otp
            await createPasswordReset({
                    userId: user.id,
                    otpHash: hashedOtp,
                    expiresAt: new Date(Date.now() + toMs(1, 'h')),
                    createdAt: new Date(),
                }, trx
            )

            // TODO: send email
            console.log(`mocked email sent to "${user.email}" with OTP: ${otp}`);

            return {
                user,
                member,
                branchIds: data.branchIds,
                roleName: data.role
            };
        });
        return {
            id: result.member.id,
            restaurantId,
            user: toUserResponse(result.user),
            role: result.roleName,
            status: result.member.status,
            branchIds: result.branchIds,
            createdAt: result.member.createdAt
        };
    }
}

export const memberService = new MemberService();