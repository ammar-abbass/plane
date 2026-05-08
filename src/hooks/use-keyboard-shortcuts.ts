"use client";

import { useEffect } from "react";

type Options = {
  onNewIssue?: () => void;
  onSearch?: () => void;
};

export function useKeyboardShortcuts({ onNewIssue, onSearch }: Options) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const inInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // ⌘K — search
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        onSearch?.();
        return;
      }

      if (inInput) return;

      // C — new issue
      if (event.key === "c" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        onNewIssue?.();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNewIssue, onSearch]);
}
