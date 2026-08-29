import {Knex} from "knex";
import {db} from "../../../lib/knex/knex";
import {RestaurantMember} from "../entity/restaurant-member.entity";
import {MemberStatus} from "../member.enums";

const MEMBER_COLUMNS = [
    'id',
    'restaurant_id',
    'user_id',
    'role_id',
    'status',
    'created_at',
    'updated_at'
];

function toEntity(row:any) {
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

export async function findRestaurantMemberWithRole(userId: number): Promise<{member: RestaurantMember; roleName:string;}> {
    const row = await db("restaurant_members as rm").select(
        "rm.restaurant_id",
        "rm.id",
        "r.name as roleName"
    ).leftJoin("roles as r","rm.role_id","r.id")
        .where("rm.user_id", userId)
        .andWhere("rm.status",MemberStatus.ACTIVE).first();
    return {
        member: toEntity(row),
        roleName: row.roleName,
    };
}