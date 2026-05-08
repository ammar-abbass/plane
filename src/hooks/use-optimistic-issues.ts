"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateIssue } from "@/server/actions/issue.actions";
import type { IssueStatus } from "@/types";

export function useOptimisticIssueStatus(projectId: string, workspaceSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { issueId: string; status: IssueStatus }) =>
      updateIssue({ issueId: vars.issueId, workspaceSlug, status: vars.status }),
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: ["issues", projectId] });
      const previous = queryClient.getQueryData(["issues", projectId]);
      queryClient.setQueryData(["issues", projectId], (old: unknown) => {
        if (!Array.isArray(old)) return old;
        return (old as { id: string; status: string }[]).map((issue) =>
          issue.id === vars.issueId ? { ...issue, status: vars.status } : issue,
        );
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["issues", projectId], context.previous);
      }
    },
    // No onSettled invalidation — SSE delivers the authoritative update (see incident 001)
  });
}
