import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

if (!url || !token) {
  throw new Error(
    "Upstash Redis env vars missing. Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (or the KV_REST_API_* aliases from Vercel Marketplace).",
  );
}

export const redis = new Redis({ url, token });
