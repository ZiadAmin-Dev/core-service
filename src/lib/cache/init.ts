import { RedisCacheProvider } from "../../pkg/cache/redis";
import { env } from "../config/env";

export const cacheProvider = new RedisCacheProvider(env.redis);