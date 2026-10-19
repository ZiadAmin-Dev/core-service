import {Request, Response, NextFunction} from "express";
import {ICacheProvider} from "../../pkg/cache/cache.interface";
import {container} from "../di/container";
import {TOKENS} from "../di/tokens";
import { toSec } from "../../pkg/utils/time";

const TTL = toSec(1, 'd'); // 1 day

interface IdempotencyOptions {
    strict?: boolean; // If true, the same idempotency key must be used for the same request body
    userScope?: boolean; // If true, the idempotency key is scoped to the user making the request
}

export function idempotency(options: IdempotencyOptions = {}) { 
    const {strict = false, userScope = false} = options;
    return async (req: Request, res: Response, next: NextFunction) => { 
        if(!['POST', 'PUT', 'PATCH'].includes(req.method)) {
            return next();
        }

        const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

        if (!idempotencyKey) {
            if (strict) {
                return res.status(400).json({
                    error: "Missing Idempotency-Key header",
                });
            }
            return next();
        }

        try {
            const cacheProvider: ICacheProvider = container.resolve(TOKENS.CacheProvider);
            let key = `idempotency:${req.method}:${req.originalUrl}:${idempotencyKey}`;

            if (userScope) {
                if (!req.user?.userId) {
                    return res.status(401).json({
                        error: "User ID required for user-scoped idempotency",
                    });
                }
                key = `${key}:userId:${req.user?.userId}`;
            }

            const cached = await cacheProvider.get(key);
            if (cached) {
                return res.status(200).json(JSON.parse(cached));
            }

            const originalJson = res.json.bind(res);

            res.json = ((body: any) => {
                cacheProvider.set(key, JSON.stringify(body), TTL);
                return originalJson(body);
            });

            next();
        } catch {
            if (strict) {
                return res.status(503).json({
                    error: "Idempotency service unavailable",
                });
            }
            next();
        }
    }
}
