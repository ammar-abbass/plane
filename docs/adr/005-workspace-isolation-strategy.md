# ADR 005 — Workspace Isolation Strategy

**Status:** Accepted  
**Date:** 2025-03-01

## Decision

Implement workspace isolation via application-layer `workspaceId` scoping on every query. Not via database-level row security (RLS) or separate schemas per tenant.

## Context

Multi-tenancy can be implemented at three levels:
1. **Separate databases per tenant** — maximum isolation, maximum cost
2. **Separate schemas per tenant** — good isolation, complex migrations
3. **Shared schema with tenant ID column** — simplest, relies on application logic

## Rationale for Shared Schema + Application Scoping

1. **Neon free tier.** A single Neon project with one database is free. Separate databases per workspace would cost money immediately.

2. **Simple migrations.** One migration file applies to all tenants simultaneously. Separate schemas require per-tenant migration tracking.

3. **`requireWorkspaceMember` as the enforcement layer.** Every server action and query calls `requireWorkspaceMember(workspaceSlug, userId)` before any data access. This function:
   - Verifies the user is a member of the workspace
   - Returns the `workspaceId` and `role`
   - Throws `FORBIDDEN` if the user is not a member

4. **`workspaceId` on every query.** Every Drizzle query that reads workspace-scoped data includes `workspaceId` in the `where` clause. This is enforced by code review and auditable in git.

## How Cross-Workspace Access Is Prevented

```typescript
// Every query function signature is:
async function getIssuesByProject(workspaceId: string, projectId: string)

// The workspaceId always comes from requireWorkspaceMember, never from user input
const member = await requireWorkspaceMember(workspaceSlug, userId);
const issues = await getIssuesByProject(member.workspaceId, projectId);
//                                        ↑ from verified membership, not user input
```

A user cannot forge a `workspaceId` because it comes from the authenticated membership record, not from request parameters.

## Trade-offs

- Row-level security (Postgres RLS) would enforce isolation at the database level, making application-layer bypasses impossible. However, RLS adds complexity to migrations and Drizzle query construction.
- With shared schema, a bug in `requireWorkspaceMember` could theoretically allow cross-tenant access. This is mitigated by: (a) the function is simple and well-tested, (b) every query independently includes `workspaceId`.

## Verdict

Application-layer isolation with `workspaceId` on every query is the correct choice for this scale. If this were a commercial product handling sensitive data, Postgres RLS would be added as a defence-in-depth layer.
