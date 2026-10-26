import "reflect-metadata"
import http  from 'http';
import { createApp } from './app';
import { env } from './lib/config/env';
import { db } from './lib/knex/knex';
import { logger } from './lib/logger/logger';

const app = createApp();
const server = http.createServer(app);

server.listen(env.PORT, () =>{
    logger.info(`server listening on ${env.PORT}`)
})


async function shutdown() {
    logger.info("Shutdown signal received. Closing HTTP server...");

    // 1. Force exit after 10 seconds if connections are stuck
    const forceExitTimeout = setTimeout(() => {
        logger.error("Forced shutdown due to timeout");
        process.exit(1);
    }, 10000);

    // 2. Stop accepting new requests & wait for current ones to finish
    server.close(async () => {
        logger.info("HTTP server closed. Destroying DB connections...");
        try {
            await db.destroy();
            logger.info("Database connections closed successfully.");
            clearTimeout(forceExitTimeout);
            process.exit(0);
        } catch (err) {
            logger.error("Error during DB cleanup:", {error: (err as Error).message});
            process.exit(1);
        }
    });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);