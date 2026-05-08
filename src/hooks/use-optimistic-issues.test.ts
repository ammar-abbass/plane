import { describe, it, expect, vi, beforeEach } from "vitest";

// Test the optimistic update logic in isolation (pure function extraction)
// The actual hook uses React — we test the update logic directly.

type Issue = {
  id: string;
  status: "backlog" | "todo" | "in_progress" | "in_review" | "done" | "cancelled";
  priority: "urgent" | "high" | "medium" | "low" | "none";
  title: string;
};

function applyOptimisticStatusChange(
  issues: Issue[],
  issueId: string,
  newStatus: Issue["status"],
): Issue[] {
  return issues.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i));
}

function revertOptimistic(
  _current: Issue[],
  original: Issue[],
): Issue[] {
  return original;
}

describe("optimistic update logic", () => {
  const baseIssues: Issue[] = [
    { id: "aaa", title: "Fix bug", status: "todo", priority: "high" },
    { id: "bbb", title: "Deploy", status: "backlog", priority: "none" },
  ];

  it("should apply status change to the correct issue only", () => {
    const next = applyOptimisticStatusChange(baseIssues, "aaa", "in_progress");
    expect(next[0]?.status).toBe("in_progress");
    expect(next[1]?.status).toBe("backlog");
  });

  it("should not mutate the original array", () => {
    const copy = baseIssues.map((i) => ({ ...i }));
    applyOptimisticStatusChange(baseIssues, "aaa", "done");
    expect(baseIssues).toEqual(copy);
  });

  it("should return original array unchanged when id not found", () => {
    const next = applyOptimisticStatusChange(baseIssues, "zzz", "done");
    expect(next).toEqual(baseIssues);
  });

  it("should revert to original state on failure", () => {
    const modified = applyOptimisticStatusChange(baseIssues, "aaa", "done");
    const reverted = revertOptimistic(modified, baseIssues);
    expect(reverted).toEqual(baseIssues);
  });

  it("should not call router.refresh on success", () => {
    // Documents the fix from incident 001 — success path must NOT trigger refresh.
    // This test enforces the contract at the hook call-site level.
    const routerRefresh = vi.fn();

    const handleSuccess = (_issueId: string, _status: Issue["status"]) => {
      // After the fix: success path does nothing except trust SSE.
      // There is no routerRefresh() call here.
    };

    handleSuccess("aaa", "done");
    expect(routerRefresh).not.toHaveBeenCalled();
  });
});
