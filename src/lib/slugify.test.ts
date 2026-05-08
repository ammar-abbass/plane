import { describe, it, expect } from "vitest";
import { slugify, isValidSlug } from "./slugify";

describe("slugify", () => {
  it("should convert spaces to hyphens", () => {
    expect(slugify("hello world")).toBe("hello-world");
  });

  it("should lowercase everything", () => {
    expect(slugify("HELLO WORLD")).toBe("hello-world");
  });

  it("should remove special characters", () => {
    expect(slugify("hello@world!")).toBe("helloworld");
  });

  it("should trim to max length", () => {
    const long = "a".repeat(100);
    expect(slugify(long).length).toBe(48);
  });
});

describe("isValidSlug", () => {
  it("should accept valid slugs", () => {
    expect(isValidSlug("hello-world")).toBe(true);
    expect(isValidSlug("abc123")).toBe(true);
  });

  it("should reject uppercase", () => {
    expect(isValidSlug("Hello")).toBe(false);
  });

  it("should reject special chars", () => {
    expect(isValidSlug("hello_world")).toBe(false);
  });

  it("should reject empty", () => {
    expect(isValidSlug("")).toBe(false);
  });
});
