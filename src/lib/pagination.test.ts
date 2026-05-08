import { describe, it, expect } from "vitest";
import { normalizePageInput, encodeCursor, decodeCursor, buildPageResult } from "./pagination";

describe("normalizePageInput", () => {
  it("should default limit to 25", () => {
    const result = normalizePageInput({});
    expect(result.limit).toBe(25);
    expect(result.cursor).toBeNull();
  });

  it("should cap limit at 100", () => {
    const result = normalizePageInput({ limit: 200 });
    expect(result.limit).toBe(100);
  });

  it("should use provided cursor", () => {
    const result = normalizePageInput({ cursor: "abc" });
    expect(result.cursor).toBe("abc");
  });
});

describe("encodeCursor / decodeCursor", () => {
  it("should round-trip correctly", () => {
    const id = "uuid-123";
    const createdAt = new Date("2026-01-01T00:00:00Z");
    const encoded = encodeCursor(id, createdAt);
    const decoded = decodeCursor(encoded);
    expect(decoded).toEqual({ id, createdAt });
  });

  it("should return null for invalid cursor", () => {
    expect(decodeCursor("not-valid")).toBeNull();
  });
});

describe("buildPageResult", () => {
  it("should indicate no more pages when items <= limit", () => {
    const items = [{ id: "1", createdAt: new Date(), name: "a" }];
    const result = buildPageResult(items as { id: string; createdAt: Date; name: string }[], 25);
    expect(result.hasMore).toBe(false);
    expect(result.nextCursor).toBeNull();
  });

  it("should indicate more pages when items > limit", () => {
    const items = [
      { id: "1", createdAt: new Date("2026-01-01T00:00:00Z"), name: "a" },
      { id: "2", createdAt: new Date("2026-01-02T00:00:00Z"), name: "b" },
    ];
    const result = buildPageResult(items, 1);
    expect(result.hasMore).toBe(true);
    expect(result.data.length).toBe(1);
    expect(result.nextCursor).not.toBeNull();
  });
});
