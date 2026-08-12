import { db } from "../../../common/knex/knex";
import { User } from "../entity/user.entity";
import { UpdateUserProfileData } from "../user.utils"

const USER_COLUMNS = [ 
    "id", 
    "email", 
    "phone", 
    "name", 
    "password_hash", 
    "system_role", 
    "created_at", 
    "updated_at", 
    "deleted_at" 
]

function toEntity(row: any){
    return new User({
        id: row.id,
        email: row.email,
        phone: row.phone,
        name: row.name,
        passwordHash: row.password_hash,
        systemRole: row.system_role,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        deletedAt: row.deleted_at
    })
}

//========================================================================================
//                                  FIND USER METHODS
//========================================================================================
export async function findUserById(id: number): Promise<User | undefined> {
    const row = await db("users").select(
        USER_COLUMNS
    ).where("id", id).whereNull("deleted_at").first();
    
    return row? toEntity(row) : undefined;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
    const row = await db("users").select(
        USER_COLUMNS
    ).where("email", email).whereNull("deleted_at").first();

    return row? toEntity(row) : undefined;
}

export async function findUserByPhone(phone: string): Promise<User | undefined> {
    const row = await db("users").select(
        USER_COLUMNS
    ).where("phone", phone).whereNull("deleted_at").first();

    console.log("findUserByPhone row:", row);
    return row? toEntity(row) : undefined;
}


//========================================================================================
//                              FIND EXISTING METHODS
//========================================================================================
export async function findUserExistsById(id: number): Promise<Boolean> {
    const result = await db.raw(`
        SELECT EXISTS(
        SELECT 1 FROM users WHERE id = ?
        ) AS "exists"`, [id]);
    return result.rows[0].exists;
}

export async function findUserExistsByEmailOrPhone(email: string, phone: string): Promise<Boolean> {
    const result = await db.raw(`
        SELECT EXISTS(
        SELECT 1 FROM users WHERE email = ? OR phone = ?
        ) AS "exists"`, [email, phone]);
    return result.rows[0].exists;
}

export async function findUserExistsByEmail(email: string): Promise<Boolean> {
    const result = await db.raw(`
        SELECT EXISTS(
        SELECT 1 FROM users WHERE email = ?
        ) AS "exists"`, [email]);
    return result.rows[0].exists;
}

export async function findUserExistsByPhone(phone: string): Promise<Boolean> {
    const result = await db.raw(`
        SELECT EXISTS(
        SELECT 1 FROM users WHERE phone = ?
        ) AS "exists"`, [phone]);
    return result.rows[0].exists;
}

//========================================================================================
//                                  CREATE METHODS
//========================================================================================
export async function createUser(user: Partial<User>): Promise<User> {
    const [row] = await db("users").insert({
        email: user.email,
        phone: user.phone,
        name: user.name,
        password_hash: user.passwordHash,
        system_role: user.systemRole,
        created_at: user.createdAt,
        updated_at: user.updatedAt
    }).returning(USER_COLUMNS);

    return toEntity(row);
}



//========================================================================================
//                                  UPDATE METHODS
//========================================================================================
export async function updateUserPassword(id: number, password: string) :Promise<void> {
    await db("users").where("id", id).update({password_hash: password});
}

export async function updateUserProfile(id: number, data: UpdateUserProfileData): Promise<User> {
    const [row] = await db("users").where("id", id).update(data).returning(USER_COLUMNS);
    return toEntity(row);
}