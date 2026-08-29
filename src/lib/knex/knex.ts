import config from "./knexfile"
import knex from "knex";

export const db = knex(config);

export async function pingDB() {
    await db.raw("SELECT 1")
}