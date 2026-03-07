import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("hashPassword returns different hashes for same password", () => {
    const h1 = hashPassword("secret");
    const h2 = hashPassword("secret");
    expect(h1).not.toBe(h2);
    expect(h1).toContain(":");
    expect(h2).toContain(":");
  });

  it("verifyPassword returns true for correct password", () => {
    const hash = hashPassword("mypassword");
    expect(verifyPassword("mypassword", hash)).toBe(true);
  });

  it("verifyPassword returns false for wrong password", () => {
    const hash = hashPassword("mypassword");
    expect(verifyPassword("wrong", hash)).toBe(false);
  });

  it("verifyPassword returns false for invalid stored format", () => {
    expect(verifyPassword("any", "invalid")).toBe(false);
  });
});
