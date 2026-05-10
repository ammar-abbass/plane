import type { PageInput, PageResult } from "@/types";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

export function normalizePageInput(input: PageInput): { cursor: string | null; limit: number } {
  const cursor = input.cursor ?? null;
  const limit = Math.min(Math.max(input.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { cursor, limit };
}

export function encodeCursor(id: string, createdAt: Date): string {
  return Buffer.from(`${id}:${createdAt.toISOString()}`).toString("base64");
}

export function decodeCursor(cursor: string): { id: string; createdAt: Date } | null {
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf-8");
    const sep = decoded.indexOf(":");
    if (sep === -1) return null;
    const id = decoded.slice(0, sep);
    const iso = decoded.slice(sep + 1);
    if (!id || !iso) return null;
    const createdAt = new Date(iso);
    if (Number.isNaN(createdAt.getTime())) return null;
    return { id, createdAt };
  } catch {
    return null;
  }
}

export function buildPageResult<T extends { id: string; createdAt: Date }>(
  items: T[],
  limit: number,
): PageResult<Omit<T, "createdAt">> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const lastItem = data[data.length - 1];
  const nextCursor = hasMore && lastItem ? encodeCursor(lastItem.id, lastItem.createdAt) : null;

  return {
    data: data.map(({ createdAt: _, ...rest }) => rest),
    nextCursor,
    hasMore,
  };
}
