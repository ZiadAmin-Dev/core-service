import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.raw(
        `
        CREATE TABLE password_resets(
            id SERIAL PRIMARY KEY,
            user_id BIGINT NOT NULL,
            otp_hash TEXT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP NOT NULL,
            consumed_at TIMESTAMP,

            CONSTRAINT fk_password_resets_user_id FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE INDEX idx_password_resets_user_id ON password_resets(user_id);
        `
    )
}


export async function down(knex: Knex): Promise<void> {
    await knex.raw(
        `
        DROP TABLE password_resets
        `
    )
}

