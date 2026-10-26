import express from 'express';
import { routes } from './routes';
import { errorHandler } from './lib/error/errorHandler';
import { correlationId } from './lib/correlation/correlationId';
import cookieParser from "cookie-parser";
import { env } from './lib/config/env';
import cors from 'cors';
import helmet from 'helmet';

//localhost:3000/api/....
export function createApp(): express.Application {
    const app = express();
    app.use(helmet());
    app.use(cors({ origin: env.cors.origins, credentials: true }));
    app.set('query parser', 'extended');
    app.use(express.json({limit: '10mb'})); //to handle large payloads, like images
    app.use(cookieParser())
    app.use(correlationId)
    app.use("/api", routes);
    app.use(errorHandler);
    return app;
}