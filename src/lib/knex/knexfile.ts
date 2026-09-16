import { env } from "../config/env";
import type { Knex } from "knex";

const config: Knex.Config = {
    client: "pg", // this is the database client, in this case
    connection: {
        host: env.db.host,
        port: env.db.port,
        user: env.db.username,
        password: env.db.password,
        database: env.db.name,
    },

    pool: { min: env.db.poolMin, max: env.db.poolMax },

    migrations: {
        directory: env.db.migrationDirectory,
        extension: env.db.migrationExtension,
    }
}

export default config;