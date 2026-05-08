# Plane

**A multi-tenant real-time collaboration platform with workspace isolation and immutable audit logs.**

Not a project management app. A platform that enforces hard workspace boundaries at the query layer, broadcasts mutations to every connected client in under two seconds via SSE + Redis pub/sub, and writes every state change to an append-only activity log in the same Postgres transaction as the mutation — so you always know who did what and when.

Built with Next.js 16 App Router, TypeScript (strict), Drizzle ORM, Neon PostgreSQL, Clerk, and Upstash Redis.

**Live URL:** [https://plane-demo.vercel.app](https://plane-demo.vercel.app)

---

## What This Demonstrates

| Concern                   | Implementation                                                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Multi-tenancy**         | Every Drizzle query is scoped by `workspaceId`. Cross-workspace access is architecturally impossible — the ID comes from the authenticated membership record, never from user input. |
| **Real-time**             | SSE + Upstash Redis pub/sub. Mutations broadcast to all workspace members in < 2 seconds. Zero polling on the client — `useIssueStream` updates the Tanstack Query cache directly.   |
| **Immutable audit log**   | Every issue mutation writes an activity record in the **same Postgres transaction**. Activity rows are never updated or deleted.                                                     |
| **Typed error contracts** | Server actions return `Result<T>`. Raw Drizzle errors, stack traces, and internal messages never reach the HTTP response.                                                            |
| **Auth at every layer**   | `requireWorkspaceMember` is called at the top of every server action and query. No server action skips this check.                                                                   |
| **Observability**         | Pino structured JSON logs on all server-side code. OpenTelemetry spans on the SSE endpoint (`sse.connection` span with duration, event count, close reason).                         |

---

## Architecture

```
Browser
  ├── Server Components      (data fetching, layout — no "use client")
  ├── Client Components      (interactivity, optimistic UI)
  ├── Server Actions         (mutations — auth + validate + db + activity + broadcast)
  └── useIssueStream         (SSE client → updates Tanstack Query cache directly)
         │
         ▼
  Next.js 16 App Router (Vercel)
         │
         ├── Drizzle ORM ──────► Neon PostgreSQL
         │                         (workspace-scoped queries, transactions)
         │
         ├── Clerk ────────────► Auth (sign-in, sessions, webhooks)
         │
         └── Upstash Redis ────► pub/sub queue per SSE subscriber
```

### Why No Separate API Server

Server actions are typed TypeScript functions called directly from client components. Auth, validation, DB write, activity record, and SSE broadcast are co-located in one auditable function. A separate Express/Fastify backend adds infrastructure without adding signal at this scale.

### Why Drizzle Over Prisma

SQL-first. No `prisma generate` step. Smaller bundle (pure TypeScript vs Rust binary). First-class Neon serverless driver support.

### Why SSE Over WebSockets

Vercel does not support persistent WebSocket connections on serverless functions. SSE is unidirectional (correct for this use case), works through corporate proxies, and reconnects automatically via the browser's `EventSource` API.

See `docs/adr/` for full decision records.

---

## Getting Started

### Prerequisites

- Node.js 24 LTS
- pnpm 10+
- A [Neon](https://neon.tech) account (free tier)
- A [Clerk](https://clerk.com) account (free tier)
- An [Upstash](https://upstash.com) account (free tier)

### 1. Clone and Install

```bash
git clone https://github.com/your-username/plane
cd plane
pnpm install
```

### 2. Set Up Environment Variables

Copy the example file:

```bash
cp .env.example .env.local
```

Fill in each variable. See the section below for how to get each one.

### 3. Run Database Migrations

```bash
pnpm db:migrate
```

### 4. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

```bash
# .env.local

# ── Clerk ──────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/workspaces
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/workspaces

# ── Database (Neon) ────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://...          # pooled connection string
DATABASE_URL_UNPOOLED=postgresql://... # direct connection (for migrations)

# ── Upstash Redis ──────────────────────────────────────────────────────────────
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# ── App ────────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ── Observability (optional) ───────────────────────────────────────────────────
LOG_LEVEL=debug                          # trace | debug | info | warn | error
OTEL_EXPORTER_OTLP_ENDPOINT=            # e.g. https://api.honeycomb.io
```

### How to Get Each Credential

#### Clerk

1. Create a project at [clerk.com](https://clerk.com)
2. Go to **API Keys** → copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
3. Go to **Webhooks** → create endpoint pointing to `https://your-domain/api/webhooks/clerk`
4. Select events: `user.created` — copy the signing secret as `CLERK_WEBHOOK_SECRET`

#### Neon

1. Create a project at [neon.tech](https://neon.tech)
2. Go to **Connection Details** → select **Pooled connection** → copy as `DATABASE_URL`
3. Switch to **Direct connection** → copy as `DATABASE_URL_UNPOOLED`

#### Upstash

1. Create a Redis database at [upstash.com](https://upstash.com)
2. Go to **Details** → copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

---

## Development Commands

```bash
# Development
pnpm dev                  # Start dev server (http://localhost:3000)
pnpm dev:db               # Open Drizzle Studio (database browser)

# Database
pnpm db:generate          # Generate migration from schema changes
pnpm db:migrate           # Apply all pending migrations
pnpm db:studio            # Open Drizzle Studio GUI
pnpm db:push              # Push schema directly (dev only — no migration file)

# Code Quality
pnpm lint                 # ESLint
pnpm lint:fix             # ESLint with auto-fix
pnpm typecheck            # TypeScript type check (tsc --noEmit)
pnpm format               # Prettier format

# Testing
pnpm test                 # Vitest unit tests
pnpm test:watch           # Vitest in watch mode
pnpm test:coverage        # Coverage report
pnpm test:e2e             # Playwright e2e tests
pnpm test:e2e:ui          # Playwright with UI mode

# Build
pnpm build                # Production build
pnpm start                # Start production server
```

---

## Production Deployment

### Vercel

1. Push to GitHub
2. Import project at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env.local`
4. Set `DATABASE_URL_UNPOOLED` for the migration step
5. Deploy

Vercel runs `pnpm build` automatically. Migrations must be run manually before the first deploy:

```bash
DATABASE_URL_UNPOOLED=your_direct_url pnpm db:migrate
```

### Clerk Webhook (Production)

After deploying:

1. Update the Clerk webhook endpoint URL to your production domain
2. Verify the `CLERK_WEBHOOK_SECRET` matches

---

## Testing

### Unit Tests (Vitest)

```bash
pnpm test
```

Covers: `requireWorkspaceMember`, `slugify`, `hasMinimumRole`, Zod schema validation, cursor pagination, `recordActivity` action string generation.

### E2E Tests (Playwright)

```bash
# Requires a running dev server + test database
pnpm test:e2e
```

Critical paths covered:

- Sign up → create workspace → create project → create issue
- Update issue status → second tab reflects change via SSE
- Search for issue by title
- Non-member gets 403

---

## Key Design Decisions

1. **`requireWorkspaceMember` is the authorization boundary.** Every server action that touches workspace data calls it before any other logic. Its return value provides `workspaceId` and `role` — no additional membership queries needed.

2. **Server actions return `Result<T>`, never throw.** Raw errors are caught at the `tryCatch` boundary, logged server-side with Pino, and returned as `INTERNAL_ERROR` to the client. Stack traces never leave the server.

3. **Activity log in the same transaction.** `recordActivity()` is called inside `db.transaction()` alongside the mutation. If the mutation fails, no orphaned activity records are created. If activity recording fails, the mutation rolls back.

4. **SSE as the single source of truth for updates.** After a successful mutation, the client does not call `router.refresh()`. The SSE event delivers the authoritative server state to all connected clients. See `docs/incidents/001-optimistic-update-revert.md`.

5. **No `any`. No `unknown` without narrowing.** TypeScript strict mode throughout, including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.

---

## Documentation

| Document                 | Description                                                                    |
| ------------------------ | ------------------------------------------------------------------------------ |
| `docs/performance.md`    | N+1 prevention, sequence_id race condition benchmark, Postgres index rationale |
| `docs/observability.md`  | Pino + OpenTelemetry setup guide                                               |
| `docs/sse-capacity.md`   | Vercel SSE concurrency analysis — how many users this handles                  |
| `docs/adr/`              | 5 Architecture Decision Records                                                |
| `docs/incidents/001-...` | Post-mortem: optimistic update revert bug                                      |

---

## License

MIT
