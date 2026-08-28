import { toMs } from "../utils/time";

interface CacheEntry<T> {
    data: T;
    cachedAt: number;
}

export class InMemoryCacheService {
    private cache: Map<string, CacheEntry<any>> = new Map();
    
    private readonly defaultTTL: number;

    constructor(defaultTTLInHours = 1) {
        this.defaultTTL = toMs(defaultTTLInHours, 'h');
    }

    async getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttl = this.defaultTTL): Promise<T> {
        const cached = this.cache.get(key);
        const now = Date.now();

        if (cached && (now - cached.cachedAt) < ttl) {
            return cached.data as T;
        }

        const freshData = await fetcher();

        this.cache.set(key, {
            data: freshData,
            cachedAt: now
        });

        return freshData;
    }

    invalidate(key: string): void {
        this.cache.delete(key);
    }
    
    clearAll(): void {
        this.cache.clear();
    }
}