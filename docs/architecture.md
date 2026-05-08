# Architecture

## System Diagram

```mermaid
graph TD
    Browser -->|HTTP / SSE| NextJS[Next.js App Router]
    NextJS -->|Server Actions| Auth[Clerk Auth]
    NextJS -->|Queries| DB[(Neon PostgreSQL)]
    NextJS -->|Pub/Sub| Redis[Upstash Redis]
    Redis -->|Broadcast| SSE[SSE Stream]
    SSE -->|Real-time| Browser
```

## Data Flow: Create Issue

1. User submits issue form → `createIssue` Server Action
2. Auth check: `auth()` + `requireWorkspaceMember`
3. Validation: Zod schema parse
4. Transaction:
   a. Generate `sequence_id` via `COALESCE(MAX(sequence_id), 0) + 1`
   b. Insert into `issues`
   c. Record activity in `activity_log`
5. Broadcast: `broadcastIssueUpdate` → Upstash Redis
6. SSE handler forwards to connected clients
7. Client `useIssueStream` updates Tanstack Query cache
8. UI reflects new issue without refetch
