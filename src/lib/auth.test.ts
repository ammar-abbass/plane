import { describe, it, expect } from "vitest";
import { hasMinimumRole } from "./auth";
import type { WorkspaceRole } from "@/types";

describe("hasMinimumRole", () => {
  it("should return true when roles are equal", () => {
    expect(hasMinimumRole("admin", "admin")).toBe(true);
  });

  it("should return true when actual is higher", () => {
    expect(hasMinimumRole("owner", "admin")).toBe(true);
    expect(hasMinimumRole("admin", "member")).toBe(true);
  });

  it("should return false when actual is lower", () => {
    expect(hasMinimumRole("member", "admin")).toBe(false);
    expect(hasMinimumRole("viewer", "member")).toBe(false);
  });

  it("should return true for owner against any role", () => {
    const roles: WorkspaceRole[] = ["owner", "admin", "member", "viewer"];
    for (const role of roles) {
      expect(hasMinimumRole("owner", role)).toBe(true);
    }
  });
});
