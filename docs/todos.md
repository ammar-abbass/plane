## 11. API Design

### Route Handlers (HTTP endpoints)

These are the only Route Handlers needed. All mutations happen via server actions.

```
GET  /api/workspaces/[workspaceSlug]/issues/stream
     → SSE stream for real-time issue updates within a workspace
     → Auth: Clerk session cookie required
     → Response: text/event-stream
     → Events: { type: 'issue.updated', data: IssueUpdate }

GET  /api/workspaces/[workspaceSlug]/search
     → Full-text search across issues in a workspace
     → Query params: q (required), projectId (optional), limit (default 20)
     → Auth: Clerk session cookie required
     → Response: { results: SearchResult[] }

POST /api/webhooks/clerk
     → Clerk user lifecycle events
     → Auth: Svix signature header validation
     → Body: Clerk webhook payload

GET  /api/health
     → Liveness check
     → Response: { status: 'ok', timestamp: string }
```

### Server Actions (Mutations)

All mutations are Next.js server actions. They validate input with Zod, check authorization, execute the mutation, record activity, and return a typed result.

#### Workspace Actions (`src/server/actions/workspace.actions.ts`)

```
createWorkspace(input: CreateWorkspaceInput): Promise<Result<Workspace>>
updateWorkspace(input: UpdateWorkspaceInput): Promise<Result<Workspace>>
deleteWorkspace(workspaceSlug: string): Promise<Result<void>>
inviteMember(input: InviteMemberInput): Promise<Result<WorkspaceMember>>
updateMemberRole(input: UpdateMemberRoleInput): Promise<Result<WorkspaceMember>>
removeMember(input: RemoveMemberInput): Promise<Result<void>>
```

#### Project Actions (`src/server/actions/project.actions.ts`)

```
createProject(input: CreateProjectInput): Promise<Result<Project>>
updateProject(input: UpdateProjectInput): Promise<Result<Project>>
deleteProject(input: DeleteProjectInput): Promise<Result<void>>
createLabel(input: CreateLabelInput): Promise<Result<Label>>
deleteLabel(input: DeleteLabelInput): Promise<Result<void>>
```

#### Issue Actions (`src/server/actions/issue.actions.ts`)

```
createIssue(input: CreateIssueInput): Promise<Result<Issue>>
updateIssue(input: UpdateIssueInput): Promise<Result<Issue>>
deleteIssue(input: DeleteIssueInput): Promise<Result<void>>
addLabel(input: AddLabelInput): Promise<Result<void>>
removeLabel(input: RemoveLabelInput): Promise<Result<void>>
addComment(input: AddCommentInput): Promise<Result<Comment>>
updateComment(input: UpdateCommentInput): Promise<Result<Comment>>
deleteComment(input: DeleteCommentInput): Promise<Result<void>>
```

### Activity Recording

Every issue mutation (status change, assignee change, priority change, label add/remove, comment add/delete) must call `recordActivity(...)` inside the same database transaction. Activity is never written after the fact — it is part of the mutation.

### Response Envelope (Server Actions)

```typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };
```

Server actions never throw to the client. They always return a Result. The client checks `result.success` and handles both branches.

### Pagination Contract

List queries that can return many rows use cursor-based pagination:

```typescript
type PageInput = {
  cursor?: string; // opaque cursor (base64-encoded last item id + created_at)
  limit?: number; // default 25, max 100
};

type PageResult<T> = {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
};
```

### Standard Error Codes

```
UNAUTHENTICATED     — no valid session
FORBIDDEN           — authenticated but not authorized
NOT_FOUND           — resource does not exist (or is hidden due to auth)
CONFLICT            — slug already taken, duplicate membership, etc.
VALIDATION_ERROR    — Zod parse failure
INTERNAL_ERROR      — unexpected server failure
```

---

## 12. Real-time Design (SSE)

### Why SSE over WebSockets

WebSockets require a persistent connection server, which Vercel does not support on standard deployments. SSE is HTTP/1.1 compatible, works on Vercel, and is sufficient for one-directional push (server → client). Issues updating in real-time is a read concern — SSE covers it completely.

### How it works

1. The issue board page mounts a client component that subscribes to `/api/workspaces/[workspaceSlug]/issues/stream`
2. The Route Handler holds the connection open and sends `keep-alive` pings every 25 seconds
3. When a server action mutates an issue, it calls `broadcastIssueUpdate(workspaceSlug, update)` before returning
4. The broadcast function writes the update to a Redis pub/sub channel: `plane:workspace:{workspaceSlug}:issues`
5. The SSE Route Handler is subscribed to that channel and forwards the event to all connected clients
6. The client's `useIssueStream` hook receives the event and updates the Tanstack Query cache directly — no refetch required

### Broadcast payload

```typescript
type IssueUpdate = {
  type: "issue.created" | "issue.updated" | "issue.deleted";
  issueId: string;
  projectId: string;
  workspaceSlug: string;
  changes: Partial<Issue>;
  actorId: string;
  timestamp: string;
};
```

### Upstash Redis for pub/sub

Use Upstash Redis (free tier) for the pub/sub channel. This is a separate Redis instance from any cache — it exists solely for SSE broadcast. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to env.

---
