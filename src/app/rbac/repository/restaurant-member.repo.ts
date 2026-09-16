import {Knex} from "knex";
import {db} from "../../../lib/knex/knex";
import {RestaurantMember} from "../entity/restaurant-member.entity";
import {MemberStatus} from "../entity/memberStatus.enums";

const MEMBER_COLUMNS = [
    'id',
    'restaurant_id',
    'user_id',
    'role_id',
    'status',
    'created_at',
    'updated_at'
];

function toEntity(row: any) {
    return new RestaurantMember({
        id: row.id,
        restaurantId: row.restaurant_id, 
        userId: row.user_id,
        roleId: row.role_id,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    })
}

export async function createRestaurantMember(data: Partial<RestaurantMember>, conn: Knex = db): Promise<RestaurantMember> {
    const [row] = await conn("restaurant_members").insert({
        restaurant_id: data.restaurantId,
        user_id: data.userId,
        role_id: data.roleId,
        status: data.status,
        created_at: data.createdAt ?? new Date(),
        updated_at: data.updatedAt ?? new Date(),
    }).returning(MEMBER_COLUMNS);
    return toEntity(row);
}

export async function activateMemberByUserId(userId: number, conn: Knex = db): Promise<RestaurantMember> {
    const [row] = await conn("restaurant_members")
    .where("user_id", userId)
    .update({
        status: MemberStatus.ACTIVE, 
        updated_at: new Date()
    }).returning(MEMBER_COLUMNS);
    return toEntity(row);
}

export async function findMembersByRestaurantId(restaurantId: number): Promise<any[]> {
    const rows = await db("restaurant_members as rm")
        .select(
            "rm.id",
            "rm.user_id",
            "u.email",
            "u.name",
            "u.phone",
            "r.name as role",
            "r.display_name as roleDisplayName",
            "rm.status"
        )
        .join("users as u", "rm.user_id", "u.id")
        .join("roles as r", "rm.role_id", "r.id")
        .where("rm.restaurant_id", restaurantId);
    return rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        email: row.email,
        name: row.name,
        phone: row.phone,
        role: row.role,
        roleDisplayName: row.roleDisplayName,
        status: row.status,
    }));
}

export async function findMemberWithRoleName(memberId: number): Promise<{member: RestaurantMember, roleName: string} | null> {
    const row = await db("restaurant_members as rm")
        .select(...MEMBER_COLUMNS.map(c => `rm.${c}`), "r.name as roleName")
        .join("roles as r", "rm.role_id", "r.id")
        .where("rm.id", memberId)
        .first();
    if (!row) return null;
    return {member: toEntity(row), roleName: row.roleName};
}


export async function findRestaurantMemberWithRole(userId: number): Promise<{member: RestaurantMember; roleName:string;} | null> {
    const row = await db("restaurant_members as rm")
        .select(
        "rm.restaurant_id",
        "rm.id",
        "r.name as roleName")
        .leftJoin("roles as r", "rm.role_id", "r.id")
        .where("rm.user_id", userId)
        .andWhere("rm.status", MemberStatus.ACTIVE).first();
    
        if (!row || !row.id) return null;
    return {
        member: toEntity(row),
        roleName: row.roleName,
    };
}

export async function updateMember(memberId: number, data: {roleId?: number, status?: string}, conn: Knex = db): Promise<void> {
    const updateData: any = {updated_at: new Date()};
    if (data.roleId !== undefined) updateData.role_id = data.roleId;
    if (data.status !== undefined) updateData.status = data.status;
    await conn("restaurant_members").where("id", memberId).update(updateData);
}

export async function deleteMember(memberId: number, conn: Knex = db): Promise<void> {
    await conn("member_branches").where("member_id", memberId).delete();
    await conn("restaurant_members").where("id", memberId).delete();
}