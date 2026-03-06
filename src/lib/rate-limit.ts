import { RateLimiterRedis } from "rate-limiter-flexible";
import { redis } from "./redis";

const RATE_LIMIT_PER_HOUR = parseInt(process.env.RATE_LIMIT_PER_HOUR || "10", 10);

export const jobRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "rl:jobs",
  points: RATE_LIMIT_PER_HOUR,
  duration: 3600,
});

export async function checkRateLimit(identifier: string): Promise<{ allowed: boolean }> {
  try {
    const result = await jobRateLimiter.consume(identifier);
    return { allowed: true };
  } catch {
    return { allowed: false };
  }
}
