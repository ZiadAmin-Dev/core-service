import { db } from "../../../common/knex/knex";
import { PasswordReset } from "../entity/password-reset.entity";


const PASSWORD_RESET_COLUMNS = [
    "id",
    "user_id",
    "otp_hash",
    "expires_at",
    "created_at",
    "consumed_at"
]

function toEntity(row: any) {
    return new PasswordReset({
        id: row.id,
        userId: row.user_id,
        otpHash: row.otp_hash,
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        consumedAt: row.consumed_at
    })
}

export async function createPasswordReset(passwordReset: Partial<PasswordReset>): Promise<void> {
    await db("password_resets").insert({
        user_id: passwordReset.userId,
        otp_hash: passwordReset.otpHash,
        expires_at: passwordReset.expiresAt,
        created_at: passwordReset.createdAt
    })
}

export async function findLatestPasswordResetByUserId(userId: number): Promise<PasswordReset | undefined> {
    const row = await db("password_resets").select(
        PASSWORD_RESET_COLUMNS
    ).where("user_id", userId).whereNull("consumed_at").orderBy("id", "desc").first();

    return toEntity(row);
}

export async function updatePasswordResetConsumedAt(passwordResetId: number): Promise<void> {
    await db("password_resets").where("id", passwordResetId).update({
        consumed_at: new Date()
    })
}