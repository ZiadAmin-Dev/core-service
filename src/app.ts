import express from 'express';
import { routes } from './routes';
import { errorHandler } from './lib/error/errorHandler';
import { correlationId } from './lib/correlation/correlationId';
import cookieParser from "cookie-parser";

//localhost:3000/api/....
export function createApp(): express.Application {
    const app = express();
    app.use(express.json());
    app.use(cookieParser())
    app.use(correlationId)
    app.use("/api", routes);
    app.use(errorHandler);
    return app;
}