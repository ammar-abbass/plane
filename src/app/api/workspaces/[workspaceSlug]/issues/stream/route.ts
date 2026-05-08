import { auth } from "@clerk/nextjs/server";
import { requireWorkspaceMember } from "@/lib/auth";
import { registerSubscriber, unregisterSubscriber } from "@/lib/realtime";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { startSpan, endSpanOk } from "@/lib/telemetry";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

const SSE_KEEPALIVE_INTERVAL_MS = 25_000;
const POLL_INTERVAL_MS = 800;
const CHANNEL_PREFIX = "plane:workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceSlug: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { workspaceSlug } = await params;
  const requestId = crypto.randomUUID();
  const log = logger.child({ requestId, workspaceSlug, userId, route: "sse" });

  try {
    await requireWorkspaceMember(workspaceSlug, userId);
  } catch {
    log.warn("SSE rejected: not a workspace member");
    return new Response("Forbidden", { status: 403 });
  }

  const channel = `${CHANNEL_PREFIX}:${workspaceSlug}:issues`;
  const queueKey = `${channel}:queue:${requestId}`;
  const span = startSpan("sse.connection", {
    "sse.workspace_slug": workspaceSlug,
    "sse.user_id": userId,
    "sse.request_id": requestId,
  });

  await registerSubscriber(workspaceSlug, requestId);
  log.info({ channel }, "SSE connection opened");
  const connectedAt = Date.now();
  let eventCount = 0;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      const send = (data: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          closed = true;
        }
      };

      send(`event: connected\ndata: ""\n\n`);

      const keepAlive = setInterval(() => {
        send(`: keep-alive\n\n`);
      }, SSE_KEEPALIVE_INTERVAL_MS);

      const poll = setInterval(async () => {
        if (closed) {
          clearInterval(poll);
          return;
        }
        try {
          const message = await redis.lpop<string>(queueKey);
          if (message) {
            const payload = typeof message === "string" ? message : JSON.stringify(message);
            send(`data: ${payload}\n\n`);
            eventCount++;
          }
        } catch (err) {
          log.error({ err }, "SSE poll error");
        }
      }, POLL_INTERVAL_MS);

      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(keepAlive);
        clearInterval(poll);

        const durationMs = Date.now() - connectedAt;
        log.info({ durationMs, eventCount }, "SSE connection closed");

        // Async cleanup — fire and forget
        Promise.all([redis.del(queueKey), unregisterSubscriber(workspaceSlug, requestId)]).catch(
          () => undefined,
        );

        span.setAttributes({
          "sse.duration_ms": durationMs,
          "sse.event_count": eventCount,
          "sse.close_reason": "client_disconnect",
        });
        endSpanOk(span);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
