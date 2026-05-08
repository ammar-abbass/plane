import { describe, it, expect, vi } from "vitest";

// Mock logger to avoid pino import during tests
vi.mock("./logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
  makeRequestLogger: () => ({ error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() }),
}));

import { tryCatch } from "./result";
import { PlaneError } from "./errors";

describe("tryCatch", () => {
  it("should return success when fn resolves", async () => {
    const result = await tryCatch(async () => 42);
    expect(result).toEqual({ success: true, data: 42 });
  });

  it("should return PlaneError fields when fn throws PlaneError", async () => {
    const result = await tryCatch(async () => {
      throw new PlaneError("NOT_FOUND", "Not found.", 404);
    });
    expect(result).toEqual({
      success: false,
      error: { code: "NOT_FOUND", message: "Not found." },
    });
  });

  it("should return INTERNAL_ERROR for unexpected errors", async () => {
    const result = await tryCatch(async () => {
      throw new Error("Database exploded");
    });
    expect(result).toEqual({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred." },
    });
  });

  it("should not leak raw error message for unexpected errors", async () => {
    const result = await tryCatch(async () => {
      throw new Error("pg: relation 'users' does not exist at connection string ...");
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).not.toContain("pg:");
      expect(result.error.message).not.toContain("relation");
    }
  });
});
