import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

function init(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Upstash Redis env vars missing. Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (or the KV_REST_API_* aliases from Vercel Marketplace).",
    );
  }
  return new Redis({ url, token });
}

/**
 * Lazy proxy around the Upstash Redis client. See packages/db/src/client.ts for
 * the rationale — defer real construction until the first property access so
 * build-time module loading does not crash when env is missing.
 */
export const redis: Redis = new Proxy({} as Redis, {
  get(_target, prop, receiver) {
    if (!_redis) _redis = init();
    return Reflect.get(_redis as object, prop, receiver);
  },
});
