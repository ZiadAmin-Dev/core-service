import path from "path"; // to resolve paths
import { config } from "dotenv"; //To read env vars
import { z } from "zod"; // To validate env vars

config({path: path.resolve(__dirname, "../../../.env")});

const schema = z.object({
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.string().default("development"),
    DB_HOST: z.string().default("localhost"),
    DB_PORT: z.coerce.number().default(5432),
    DB_USER: z.string().default("postgres"),
    DB_PASSWORD: z.string(),
    DB_NAME: z.string(),
    DB_POOL_MIN: z.coerce.number().default(2),
    DB_POOL_MAX: z.coerce.number().default(10),
    ACCESS_SECRET: z.string(), //TODO make it .min(32) to make sure it's strong
    REFRESH_SECRET: z.string(),
    ACCESS_EXPIRES_IN: z.coerce.number().default(3600),
    REFRESH_EXPIRES_IN: z.coerce.number().default(604800),
    DB_MIGRATION_DIRECTORY: z.string(),
    DB_MIGRATION_EXTENSION: z.string(),    
    BCRYPT_SALT_ROUNDS: z.coerce.number().default(10),
    CORS_ORIGINS: z.string().default("http://localhost:3000"),
    REDIS_HOST: z.string().default("localhost"),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional(),
    MAILJET_API_KEY: z.string(),
    MAILJET_SECRET_KEY: z.string(),
    MAILJET_FROM_EMAIL: z.string(),
    MAILJET_FROM_NAME: z.string(),

    // Shared secret checked by requireInternalApiKey on every /api/internal/* request.
    INTERNAL_API_KEY: z.string().default(""),

    // RabbitMQ — used by the outbox worker.
    RABBITMQ_URL: z.string().default("amqp://guest:guest@localhost:5672"),
    RABBITMQ_CORE_EVENTS_EXCHANGE: z.string().default("core.events"),
    // Cron expression for the outbox drain schedule. 6-field form; "* * * * * *" = every second.
    OUTBOX_DRAIN_CRON: z.string().default("* * * * * *"),
    OUTBOX_BATCH_SIZE: z.string().default("50"),

});

const parsed = schema.parse(process.env);

export const env = {
    PORT: Number(parsed.PORT),
    NODE_ENV: parsed.NODE_ENV,
    db:{
        host: parsed.DB_HOST,
        port: Number(parsed.DB_PORT),
        username: parsed.DB_USER,
        password: parsed.DB_PASSWORD,
        name: parsed.DB_NAME,
        poolMin: Number(parsed.DB_POOL_MIN),
        poolMax: Number(parsed.DB_POOL_MAX),
        migrationDirectory: path.resolve(__dirname,"../../../",parsed.DB_MIGRATION_DIRECTORY),
        migrationExtension: parsed.DB_MIGRATION_EXTENSION,
    },
    jwt:{
        accessSecret: parsed.ACCESS_SECRET,
        refreshSecret: parsed.REFRESH_SECRET,
        accessExpiresIn: Number(parsed.ACCESS_EXPIRES_IN),
        refreshExpiresIn: Number(parsed.REFRESH_EXPIRES_IN),
    },
    isProduction: process.env.NODE_ENV === "production",
    cors: {
        origins: parsed.CORS_ORIGINS.split(","),
    },
    security:{
        bcryptSaltRounds: Number(parsed.BCRYPT_SALT_ROUNDS,)
    },
    redis:{
        host: parsed.REDIS_HOST,
        port: Number(parsed.REDIS_PORT),
        password: parsed.REDIS_PASSWORD || undefined,
    },
    mailjet: {
        apiKey: parsed.MAILJET_API_KEY,
        secretKey: parsed.MAILJET_SECRET_KEY,
        fromEmail: parsed.MAILJET_FROM_EMAIL,
        fromName: parsed.MAILJET_FROM_NAME,
    },
    internal: {
        apiKey: parsed.INTERNAL_API_KEY,
    },
    rabbit: {
        url: parsed.RABBITMQ_URL,
        exchange: parsed.RABBITMQ_CORE_EVENTS_EXCHANGE,
        drainCron: parsed.OUTBOX_DRAIN_CRON,
        batchSize: Number(parsed.OUTBOX_BATCH_SIZE),
    },
}