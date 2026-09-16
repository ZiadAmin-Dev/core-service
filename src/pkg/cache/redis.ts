import Redis from "ioredis";
import type { ICacheProvider } from "./cache.interface";

export interface RedisConfig{
    host: string;
    port: number;
    password?: string;
}

export class RedisCacheProvider implements ICacheProvider {
    private readonly client: Redis;

    constructor(config: RedisConfig) {
        this.client = new Redis({
            host: config.host,
            port: config.port,
            password: config.password,
            lazyConnect: true,
            maxRetriesPerRequest: 3,
        });

        this.client.on("error", (err) => { console.error("Redis error:", err); });
        this.client.connect().catch((err) => { console.error("Redis connection error:", err); });
    }

    async get(key: string): Promise<any> {
        const value = await this.client.get(key);

        if (value === null) return null;

        try { return JSON.parse(value); } catch { return value; }
    }

    async set(key: string, value: any, ttlSeconds?: number): Promise<any> {
        const serializedValue = value === undefined
            ? "undefined"
            : typeof value === "string"
                ? value
                : JSON.stringify(value);

        if (ttlSeconds) {
            await this.client.set(key, serializedValue, "EX", ttlSeconds);
        } else {
            await this.client.set(key, serializedValue);
        }

        return value;
    }

    async del(key: string): Promise<any> {
        const deleted = await this.client.del(key);
        return deleted > 0;
    }
}