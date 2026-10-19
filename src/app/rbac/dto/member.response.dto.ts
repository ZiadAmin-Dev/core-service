import { MemberStatus } from "../entity/memberStatus.enums";

// Response DTOs — shapes returned by MemberService via MemberController
// (see DOCS/rbac.md).

export class MemberRowResponseDTO {
    id!: number;
    userId!: number;
    email!: string;
    name!: string;
    phone!: string;
    role!: string;
    roleDisplayName!: string;
    status!: string;

    static from(row: MemberRowResponseDTO): MemberRowResponseDTO {
        return {
            id: row.id,
            userId: row.userId,
            email: row.email,
            name: row.name,
            phone: row.phone,
            role: row.role,
            roleDisplayName: row.roleDisplayName,
            status: row.status,
        };
    }
}

export class InvitedMemberResponseDTO {
    id!: number;
    userId!: number;
    email!: string;
    name!: string;
    phone!: string;
    role!: string;
    status!: MemberStatus;
    branchIds!: number[];

    static from(data: InvitedMemberResponseDTO): InvitedMemberResponseDTO {
        return {
            id: data.id,
            userId: data.userId,
            email: data.email,
            name: data.name,
            phone: data.phone,
            role: data.role,
            status: data.status,
            branchIds: data.branchIds,
        };
    }
}

export class RolePermissionDetailResponseDTO {
    permission!: string;

    static from(row: RolePermissionDetailResponseDTO): RolePermissionDetailResponseDTO {
        return { permission: row.permission };
    }
}

export class RolePermissionsResponseDTO {
    role!: string;
    permissions!: RolePermissionDetailResponseDTO[];

    static from(role: string, permissions: RolePermissionDetailResponseDTO[]): RolePermissionsResponseDTO {
        return {
            role,
            permissions: permissions.map(RolePermissionDetailResponseDTO.from),
        };
    }
}

export class RolePermissionStringsResponseDTO {
    role!: string;
    permissions!: string[];

    static from(role: string, permissions: string[]): RolePermissionStringsResponseDTO {
        return { role, permissions };
    }
}
