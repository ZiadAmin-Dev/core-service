import { Request, Response, NextFunction } from "express";
import { ICacheProvider } from "../../pkg/cache/cache.interface";
import { container } from "../di/container";
import { TOKENS } from "../di/tokens";
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
                    // نضمن إننا بنخزن String صريح
                    const valueToCache = typeof body === 'string' ? body : JSON.stringify(body);
                    
                    // ⚡ إرسال للـ Cache في الـ Background من غير ما يعطل الـ Response
                    cacheProvider.set(key, valueToCache, ttl).catch(err => {
                        console.error("Cache set error:", err);
                    });
                }
                return originalJson(body);
            });

            next();
        }
        catch (err) {
            next(err);
        }
    }
}