import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./client";

export const chatRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
  analytics: false,
  prefix: "rl:chat",
});

export const chatDailyRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(100, "1 d"),
  analytics: false,
  prefix: "rl:chat:day",
});

export async function checkChatLimit(ip: string) {
  const minute = await chatRatelimit.limit(ip);
  if (!minute.success) return { ok: false as const, reason: "minute", reset: minute.reset };
  const day = await chatDailyRatelimit.limit(ip);
  if (!day.success) return { ok: false as const, reason: "day", reset: day.reset };
  return { ok: true as const };
}
