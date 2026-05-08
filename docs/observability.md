# Observability

## Structured Logging (Pino)

Plane uses [Pino](https://getpino.io/) for structured JSON logging across all server-side code.

### Setup

Pino is configured in `src/lib/logger.ts`. In development, output is pretty-printed via `pino-pretty`. In production, output is JSON for ingestion by log aggregators (Datadog, Loki, CloudWatch).

```typescript
import { logger } from "@/lib/logger";
logger.info({ workspaceSlug, userId }, "SSE connection opened");
logger.error({ err, workspaceSlug }, "Failed to broadcast update");
```

### Log Levels

Set via environment variable:

```
LOG_LEVEL=debug   # verbose (local dev)
LOG_LEVEL=info    # default (production)
LOG_LEVEL=warn    # quiet (CI)
```

### Log Fields

Every log entry includes:

- `level` — trace/debug/info/warn/error/fatal
- `time` — ISO 8601 timestamp
- Context fields passed at call site: `workspaceSlug`, `userId`, `requestId`, `route`

### What Gets Logged

| Event                          | Level | Fields                                    |
| ------------------------------ | ----- | ----------------------------------------- |
| SSE connection opened          | info  | workspaceSlug, userId, requestId, channel |
| SSE connection closed          | info  | durationMs, eventCount                    |
| SSE poll error                 | error | err                                       |
| Unexpected server action error | error | err                                       |
| Broadcast sent                 | debug | workspaceSlug, subscriberCount, type      |
| SSE rejected (not a member)    | warn  | workspaceSlug, userId                     |

### Production Setup (Vercel)

Vercel captures stdout automatically. To ship logs to Datadog:

1. In Vercel dashboard → Integrations → Datadog
2. Set `LOG_LEVEL=info` in environment variables
3. All Pino JSON lines flow to Datadog automatically

---

## OpenTelemetry (SSE Endpoint)

The SSE endpoint at `/api/workspaces/[workspaceSlug]/issues/stream` is instrumented with OpenTelemetry spans to observe connection lifecycle in production.

### Spans Emitted

| Span name        | Attributes                                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| `sse.connection` | `sse.workspace_slug`, `sse.user_id`, `sse.request_id`, `sse.duration_ms`, `sse.event_count`, `sse.close_reason` |

The span is started when the connection is authenticated and opened. It is ended (with all attributes set) when the client disconnects.

### Setup

#### 1. Install the SDK

Already in `package.json`:

```json
"@opentelemetry/api": "^1.9.0",
"@opentelemetry/sdk-node": "^0.57.0",
"@opentelemetry/exporter-trace-otlp-http": "^0.57.0",
"@opentelemetry/auto-instrumentations-node": "^0.57.0"
```

#### 2. Set Environment Variable

```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io
# or for Jaeger:
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

If `OTEL_EXPORTER_OTLP_ENDPOINT` is not set, traces are collected but not exported (no-op exporter).

#### 3. Configure `instrumentation.ts` (Next.js 16)

Create `src/instrumentation.ts`:

```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { OTLPTraceExporter } = await import("@opentelemetry/exporter-trace-otlp-http");
    const { getNodeAutoInstrumentations } =
      await import("@opentelemetry/auto-instrumentations-node");

    const sdk = new NodeSDK({
      serviceName: "plane",
      traceExporter: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
        ? new OTLPTraceExporter({ url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces` })
        : undefined,
      instrumentations: [getNodeAutoInstrumentations()],
    });

    sdk.start();
  }
}
```

#### 4. Verify

With Jaeger running locally:

```bash
docker run --rm -p 16686:16686 -p 4318:4318 jaegertracing/all-in-one
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 pnpm dev
```

Open Jaeger at http://localhost:16686 and select service `plane`. Connect to the SSE endpoint in a browser and you will see the `sse.connection` span appear when you disconnect.

---

## Health Check

```
GET /api/health
```

Returns `200 OK` with `{ status: "ok", timestamp: "..." }`. Used for Vercel health checks and uptime monitoring.

---

## What to Monitor in Production

1. **SSE connection duration histogram** — p50 < 5 minutes indicates users are navigating frequently
2. **SSE event count per connection** — low counts suggest issues with pub/sub delivery
3. **`sse.connection` span error rate** — should be 0%
4. **`error` log count** — alert on any unexpected errors in server actions
5. **Database query latency** — Neon's built-in metrics in the console
