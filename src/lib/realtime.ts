import { Redis } from "@upstash/redis";
import { env } from "./env";
import { logger } from "./logger";
import type { IssueUpdate } from "@/types";

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

const CHANNEL_PREFIX = "plane:workspace";
const SUBSCRIBERS_KEY_PREFIX = "plane:sse:subscribers";
const QUEUE_TTL_SECONDS = 300;

/**
 * Register an SSE subscriber. Called when a client connects.
 * Returns a cleanup function to remove the subscriber.
 */
export async function registerSubscriber(workspaceSlug: string, requestId: string): Promise<void> {
  const key = `${SUBSCRIBERS_KEY_PREFIX}:${workspaceSlug}`;
  await redis.sadd(key, requestId);
  await redis.expire(key, QUEUE_TTL_SECONDS);
}

export async function unregisterSubscriber(workspaceSlug: string, requestId: string): Promise<void> {
  const key = `${SUBSCRIBERS_KEY_PREFIX}:${workspaceSlug}`;
  await redis.srem(key, requestId);
}

/**
 * Broadcast an issue update to all active SSE subscribers for a workspace.
 * Each subscriber has a dedicated queue key that the SSE route polls.
 */
export async function broadcastIssueUpdate(
  workspaceSlug: string,
  update: IssueUpdate,
): Promise<void> {
  const subscribersKey = `${SUBSCRIBERS_KEY_PREFIX}:${workspaceSlug}`;
  const channel = `${CHANNEL_PREFIX}:${workspaceSlug}:issues`;

  try {
    const subscribers = await redis.smembers<string[]>(subscribersKey);
    if (!subscribers || subscribers.length === 0) return;

    const payload = JSON.stringify(update);
    const pipeline = redis.pipeline();

    for (const requestId of subscribers) {
      const queueKey = `${channel}:queue:${requestId}`;
      pipeline.rpush(queueKey, payload);
      pipeline.expire(queueKey, QUEUE_TTL_SECONDS);
    }

    await pipeline.exec();
    logger.debug({ workspaceSlug, subscriberCount: subscribers.length, type: update.type }, "Broadcast sent");
  } catch (err) {
    logger.error({ err, workspaceSlug }, "Failed to broadcast issue update");
  }
}
