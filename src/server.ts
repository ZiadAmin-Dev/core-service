import "reflect-metadata"
import http  from 'http';
import { createApp } from './app.js';
import { env } from './lib/config/env.js';
import {db} from './lib/knex/knex.js';

const app = createApp();
const server = http.createServer(app);

server.listen(env.PORT, () =>{
    console.log(`server listening on ${env.PORT}`)
})

async function shutdown() {
    server.close(async() =>{
        await db.destroy();
        console.log("database shutdown")
        process.exit(0);
    })
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);