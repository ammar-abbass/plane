# Incident 001 — Optimistic Update Reverting Incorrectly on Multi-Tab

**Date:** 2025-04-12  
**Severity:** P2 — Functional regression (data not lost, but UI inconsistent)  
**Status:** Resolved  
**Author:** Engineering

---

## Summary

When two browser tabs were open to the same project board, updating an issue's status in Tab A caused Tab B's optimistic UI to **revert to the pre-update state** for 1–3 seconds before SSE delivered the correct state. For users with two monitors, this appeared as a flickering regression — the card would jump back to its old column and then jump forward.

---

## Timeline

| Time | Event |
|---|---|
| T+0 | User updates issue #42 status from `todo` → `in_progress` in Tab A |
| T+0 | Tab A applies optimistic update: card moves to "In Progress" column |
| T+0 | Server action writes to DB, broadcasts SSE event to Redis queue |
| T+0.8 | Tab B SSE poll fires, receives the update, calls `queryClient.setQueryData` |
| T+0.8 | Tab B reflects correct state: `in_progress` ✅ |
| T+1.2 | Tab A server action returns `Result<{ success: true }>` |
| T+1.2 | Tab A's `useOptimisticIssues` hook called `router.refresh()` on success |
| T+1.2 | `router.refresh()` invalidated the React Server Component cache |
| T+1.4 | React re-fetched the server component, which re-serialised the initial `issues` prop |
| T+1.4 | The new `issues` prop from the server **reset `useState(issues)` in `IssueBoard`** |
| T+1.4 | Tab A briefly reverted to `todo` (old state from DB read slightly before propagation) |
| T+2.0 | SSE event arrives in Tab A too, sets it back to `in_progress` |

**Root cause:** Calling `router.refresh()` after a successful server action reset the `useState` initialiser in `IssueBoard`, which used the incoming `issues` prop as its initial value. When the refreshed server component delivered a slightly-stale snapshot (the DB read raced with the write commit), the optimistic update was visually overwritten.

---

## Root Cause Analysis

```typescript
// BEFORE (broken)
export function IssueBoard({ issues }: { issues: Issue[] }) {
  const [optimistic, setOptimistic] = useState(issues); // ← re-initialised on every prop change

  const handleStatusChange = async (issueId: string, status: IssueStatus) => {
    setOptimistic((prev) => prev.map((i) => i.id === issueId ? { ...i, status } : i));
    const result = await updateIssue({ issueId, workspaceSlug, status });
    if (result.success) {
      router.refresh(); // ← this caused the prop to change → useState reset
    } else {
      setOptimistic(issues); // revert
    }
  };
}
```

The problem: `useState(issues)` only uses the initial value **on mount**. However, when `router.refresh()` re-rendered the parent server component with a new `issues` prop, React unmounted and remounted `IssueBoard` because the RSC payload was a new component tree — resetting the state.

---

## Fix

Remove `router.refresh()` from the success path entirely. The SSE subscription already delivers the authoritative server state to all clients including the originating tab. Trust SSE as the single source of truth for updates.

```typescript
// AFTER (fixed)
const handleStatusChange = async (issueId: string, status: IssueStatus) => {
  setOptimistic((prev) => prev.map((i) => i.id === issueId ? { ...i, status } : i));
  const result = await updateIssue({ issueId, workspaceSlug, status });
  if (!result.success) {
    setOptimistic(issues); // revert to last known-good server state
    setError(result.error.message);
  }
  // No router.refresh() — SSE delivers the update to all tabs
};
```

The `useIssueStream` hook's `setQueryData` call updates the Tanstack Query cache, which the `IssueBoard` eventually reads when it next renders. The optimistic state and the authoritative SSE state converge without a visible flicker.

---

## Why the Revert Is Still Correct

The revert path (`setOptimistic(issues)`) on failure is correct because:

1. `issues` is the last prop from the server — the last known-good state
2. If the server action fails (network error, auth failure, DB error), we want to show the user the real state, not keep the optimistic lie
3. The error message is shown in the UI so the user understands what happened

The bug was only on the **success** path — where `router.refresh()` was redundant.

---

## Prevention

**Added to code review checklist:**
- Never call `router.refresh()` after a successful mutation when SSE is active on the same data
- When optimistic state diverges from server props, always audit whether `useState(prop)` is re-initialised on prop changes (it is, if the component remounts)
- Use `useEffect(() => { setOptimistic(issues); }, [issues])` if server props need to sync to local state — but prefer SSE as the update channel

**Tests added:**
- `src/hooks/use-optimistic-issues.test.ts` — asserts that a successful mutation does not call `router.refresh()`
- `tests/e2e/sse-two-tabs.spec.ts` — opens two tabs, updates an issue in one, asserts the other reflects it without reverting
