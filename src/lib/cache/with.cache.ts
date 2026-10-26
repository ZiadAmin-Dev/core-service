import { Request, Response, NextFunction } from "express";
import { ICacheProvider } from "../../pkg/cache/cache.interface";
import { container } from "../di/container";
import { TOKENS } from "../di/tokens";
import { logger } from "../logger/logger";
import { toSec } from "../../pkg/utils/time";

export function withCache(ttl = toSec(1, 'h'), userScoped = false) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const cacheProvider: ICacheProvider = container.resolve(TOKENS.CacheProvider);

            let key = `${req.method}:${req.originalUrl}`;

            if (userScoped) {
                key = `${key}:${req.user?.userId}`;
            }
            
            const cached = await cacheProvider.get(key);

            if (cached) {
                res.setHeader("X-Cache", "HIT");
                
                // ⚡ هاندلة إذا كان الـ Cached جاي String أو Object
                const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
                return res.status(200).json(data);
            }

            // لو مش موجود في الكاش، نعلم إنه MISS
            res.setHeader("X-Cache", "MISS");

            const originalJson = res.json.bind(res);

            res.json = ((body: any) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    const valueToCache = typeof body === 'string' ? body : JSON.stringify(body);
                    cacheProvider.set(key, valueToCache, ttl).catch(err => {
                        logger.error("Cache set error:", {error: (err as Error).message});
                    });
                }
                
                else if (res.statusCode === 404) {
                    // ⚡ If the response is 404, we can cache it for a shorter duration to avoid repeated DB hits for non-existent resources.
                    const valueToCache = typeof body === 'string' ? body : JSON.stringify(body);
                    const NEGATIVE_TTL = toSec(5, 'm'); // Cache 404 for 5 minutes
                    cacheProvider.set(key, valueToCache, NEGATIVE_TTL).catch(err => {
                        logger.error("Cache set error for 404 response:", {error: (err as Error).message});
                    });
                }
                return originalJson(body);
            });

            next();
        }
        catch (err) {
            // ⚡ If any unexpected error occurs in the cache layer, proceed to the Controller anyway and do not block the request!
            logger.error("Cache Middleware unexpected error, skipping cache:", {error: (err as Error).message});
            next(); // Pass without err so it moves directly to the Controller!
        }
    }
}