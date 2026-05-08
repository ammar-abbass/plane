import { describe, it, expect } from "vitest";
import { PlaneError } from "./errors";

describe("PlaneError", () => {
  it("should set code and message", () => {
    const err = new PlaneError("FORBIDDEN", "Not allowed.", 403);
    expect(err.code).toBe("FORBIDDEN");
    expect(err.message).toBe("Not allowed.");
    expect(err.statusCode).toBe(403);
  });

  it("should default statusCode to 500", () => {
    const err = new PlaneError("INTERNAL_ERROR", "Oops.");
    expect(err.statusCode).toBe(500);
  });

  it("should be instanceof Error", () => {
    const err = new PlaneError("NOT_FOUND", "Missing.", 404);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("PlaneError");
  });

  it("should be instanceof PlaneError", () => {
    const err = new PlaneError("CONFLICT", "Slug taken.", 409);
    expect(err).toBeInstanceOf(PlaneError);
  });
});
