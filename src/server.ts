import "reflect-metadata"
import http  from 'http';
import { createApp } from './app';
import { env } from './lib/config/env';
import { db } from './lib/knex/knex';

const app = createApp();
const server = http.createServer(app);

server.listen(env.PORT, () =>{
    console.log(`server listening on ${env.PORT}`)
})


//TODO: Study this code and why it's like that
async function shutdown() {
    console.log("Shutdown signal received. Closing HTTP server...");
    
    // 1. Force exit after 10 seconds if connections are stuck
    const forceExitTimeout = setTimeout(() => {
        console.error("Forced shutdown due to timeout");
        process.exit(1);
    }, 10000);

    // 2. Stop accepting new requests & wait for current ones to finish
    server.close(async () => {
        console.log("HTTP server closed. Destroying DB connections...");
        try {
            await db.destroy();
            console.log("Database connections closed successfully.");
            clearTimeout(forceExitTimeout);
            process.exit(0);
        } catch (err) {
            console.error("Error during DB cleanup:", err);
            process.exit(1);
        }
    });
}

process.on("SIGINT", shutdown); // دي معناها انو لو في اي اشارة توقف او انهاء من النظام او من المستخدم، رح ينفذ الدالة shutdown
process.on("SIGTERM", shutdown); // دي معناها انو لو في اي اشارة توقف او انهاء من النظام او من المستخدم، رح ينفذ الدالة shutdown