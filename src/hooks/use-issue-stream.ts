"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { IssueUpdate } from "@/types";

const MAX_RECONNECT_DELAY_MS = 30_000;

export function useIssueStream(workspaceSlug: string) {
  const queryClient = useQueryClient();
  const reconnectDelayRef = useRef(1000);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!workspaceSlug) return;

    const connect = () => {
      const url = `/api/workspaces/${workspaceSlug}/issues/stream`;
      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onmessage = (event: MessageEvent<string>) => {
        if (!event.data || event.data.trim() === '""') return;
        try {
          const update: IssueUpdate = JSON.parse(event.data) as IssueUpdate;
          queryClient.setQueryData(
            ["issues", update.projectId],
            (old: unknown) => {
              if (!Array.isArray(old)) return old;

              if (update.type === "issue.deleted") {
                return (old as { id: string }[]).filter((i) => i.id !== update.issueId);
              }

              const idx = (old as { id: string }[]).findIndex(
                (i) => i.id === update.issueId,
              );

              if (idx === -1 && update.type === "issue.created") {
                return [...(old as object[]), { id: update.issueId, ...update.changes }];
              }

              if (idx >= 0) {
                const next = [...(old as object[])];
                const current = next[idx];
                if (current !== undefined) {
                  next[idx] = { ...current, ...update.changes };
                }
                return next;
              }

              return old;
            },
          );
        } catch {
          // Ignore malformed SSE events
        }
      };

      es.onerror = () => {
        es.close();
        const delay = Math.min(reconnectDelayRef.current * 2, MAX_RECONNECT_DELAY_MS);
        reconnectDelayRef.current = delay;
        setTimeout(connect, delay);
      };

      es.onopen = () => {
        reconnectDelayRef.current = 1000;
      };
    };

    connect();

    return () => {
      eventSourceRef.current?.close();
    };
  }, [workspaceSlug, queryClient]);
}
