import { Knex } from "knex";
import { db } from "../../../lib/knex/knex";
import { toMs } from "../../../pkg/utils/time";
import { userAlreadyExistsError } from "../../auth/auth.errors";
import { generateOTP, hashOTP } from "../../auth/auth.utils";
import { createPasswordReset } from "../../auth/repository/password-reset.repo";
import { findUserExistsByEmailOrPhone, findUserExistsByPhone } from "../../user/repository/users.repo";
import { UserService } from "../../user/service/user.service";
import { SystemRole } from "../../user/user.enums";
import { CreateMemberDTO, UpdateMemberBranchesDTO, UpdateMemberDTO } from "../dto/member.request.dto";
import { MemberBranch } from "../entity/member-branch.entity";
import { MemberStatus } from "../entity/memberStatus.enums";
import { cannotAssignBranchesToOwners, cannotCreateOwnerMember, cannotDeleteOwnerError, invalidBranchIdsError, memberNotFoundError, roleNotFoundError } from "../rbac.errors";
import { countBranchesByIdsAndRestaurant, setMemberBranches } from "../repository/member-branch.repo";
import { getPermissionsByRoleName, getPermissionsDetailsByRoleName } from "../repository/permissions.repo";
import { createRestaurantMember, deleteMember, findMembersByRestaurantId, findMemberWithRoleName, updateMember } from "../repository/restaurant-member.repo";
import { findRoleByName } from "../repository/role.repo";
import { RestaurantMember } from "../entity/restaurant-member.entity";
import { injectable, inject } from "tsyringe";
import { TOKENS } from "../../../lib/di/tokens";
import { memberInvitationEmail } from "../templates/member-invitation";
import { IEmailProvider } from "../../../pkg/email/email.interface";


@injectable()
export class MemberService {
    constructor(
        @inject(TOKENS.UserService) private readonly userService: UserService,
        @inject(TOKENS.EmailProvider) private readonly emailProvider: IEmailProvider
    ) { }

    async createOwnerMember(restaurantId: number, userId: number, trx?: Knex.Transaction): Promise<RestaurantMember> {
        const ownerRoleId = await findRoleByName('owner', trx);
        if (!ownerRoleId) throw roleNotFoundError;
        const now = new Date();
        return createRestaurantMember({
            restaurantId,
            userId,
            roleId: ownerRoleId,
            status: MemberStatus.ACTIVE,
            createdAt: now,
            updatedAt: now,
        }, trx);
    }

    async createMember(restaurantId: number, data: CreateMemberDTO) {
        if(data.role == 'owner') throw cannotCreateOwnerMember;

        const existingUser = await findUserExistsByEmailOrPhone(data.email, data.phoneNumber);
        if (existingUser) throw userAlreadyExistsError;
        
        const roleId = await findRoleByName(data.role);
        if(!roleId) throw roleNotFoundError;

        const branchIds = data.branchIds || [];
        await this.validateBranchOwnership(branchIds, restaurantId);

        const memberPayload = await db.transaction(async (trx) => { 
            const now = new Date();
            const user = await this.userService.create({
                email: data.email,
                name: data.name,
                phone: data.phoneNumber,
                password: '',
                systemRole: SystemRole.RESTAURANT_USER,
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

            const rows = branchIds.map(branchId => new MemberBranch({
                branchId: branchId,
                memberId: member.id,
                createdAt: now,
            }))

            await setMemberBranches(member.id, rows, trx)

            // generate otp, create password reset record and send email
            const otp = generateOTP();
            const hashedOtp = hashOTP(otp);
            await createPasswordReset({
                    userId: user.id,
                    otpHash: hashedOtp,
                    expiresAt: new Date(Date.now() + toMs(7, 'd')),
                    createdAt: new Date(),
                }, trx
            )

            const email = memberInvitationEmail(otp, data.role);
            await this.emailProvider.send(data.email, email.subject, email.html);

            return {
                message: "Member invited successfully",
                member: {
                    id: member.id,
                    userId: user.id,
                    email: data.email,
                    name: data.name,
                    phone: data.phoneNumber,
                    role: data.role,
                    status: member.status,
                    branchIds,
                }
            }
        });

        return memberPayload;
    }

    async listMembers(restaurantId: number) {
        const members = await findMembersByRestaurantId(restaurantId);
        return {data: members};
    }

    async updateMember(restaurantId: number, memberId: number, data: UpdateMemberDTO) {
        // single query: member + role name
        const result = await findMemberWithRoleName(memberId);
        if (!result || Number(result.member.restaurantId) !== Number(restaurantId)) {
            throw memberNotFoundError;
        }

        const updateData: {roleId?: number, status?: string} = {};
        if (data.role) {
            const roleId = await findRoleByName(data.role);
            if (!roleId) throw roleNotFoundError;
            updateData.roleId = roleId;
        }
        if (data.status) {
            updateData.status = data.status;
        }

        await updateMember(memberId, updateData);
        return {message: "Member updated successfully"};
    }

    async deleteMember(restaurantId: number, memberId: number) {
        // single query: member + role name (no N+1)
        const result = await findMemberWithRoleName(memberId);
        if (!result || Number(result.member.restaurantId) !== Number(restaurantId)) {
            throw memberNotFoundError;
        }
        if (result.roleName === 'owner') {
            throw cannotDeleteOwnerError;
        }
        await deleteMember(memberId);
        return {message: "Member deleted successfully"};
    }

    async updateMemberBranches(restaurantId: number, memberId: number, data: UpdateMemberBranchesDTO) {
        // single query: member + role name (no N+1)
        const result = await findMemberWithRoleName(memberId);
        if (!result || Number(result.member.restaurantId) !== Number(restaurantId)) {
            throw memberNotFoundError;
        }
        if (result.roleName === 'owner') {
            throw cannotAssignBranchesToOwners;
        }

        // validate branchIds belong to this restaurant (single COUNT query)
        await this.validateBranchOwnership(data.branchIds, restaurantId);

        const rows = data.branchIds.map(branchId => new MemberBranch({
            branchId,
            memberId: result.member.id,
            createdAt: new Date(),
        }));
        await setMemberBranches(memberId, rows);

        return {
            message: "Member branch assignments updated successfully",
            branchIds: data.branchIds,
        };
    }

    async getRolePermissions(roleName: string) {
        const role = await findRoleByName(roleName);
        if (!role) throw roleNotFoundError;
        const permissions = await getPermissionsDetailsByRoleName(roleName);
        return {role: roleName, permissions};
    }

    async getPermissionsByRole(roleName: string) {
        const permissions = await getPermissionsByRoleName(roleName);
        return {role: roleName, permissions};
    }

    async validateBranchOwnership(branchIds: number[], restaurantId: number) {
        if (branchIds.length === 0) return;
        //عدلي كم فرع من القايمة بتاعت الايديز دي يخص المطعم ده
        const count = await countBranchesByIdsAndRestaurant(branchIds, restaurantId);
        if (count !== branchIds.length) {
            throw invalidBranchIdsError;
        }
    }
}