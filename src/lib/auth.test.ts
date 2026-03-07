import { describe, it, expect } from "vitest";
import {
  createSession,
  verifySession,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from "./auth";

describe("auth", () => {
  it("createSession returns base64 encoded userId", () => {
    const token = createSession("user-123");
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
  });

  it("verifySession returns userId for valid token", () => {
    const userId = "550e8400-e29b-41d4-a716-446655440000";
    const token = createSession(userId);
    expect(verifySession(token)).toBe(userId);
  });

  it("verifySession returns null for invalid token", () => {
    expect(verifySession("invalid")).toBeNull();
  });

  it("verifySession returns null for undefined", () => {
    expect(verifySession(undefined)).toBeNull();
  });

  it("verifySession returns null for empty string", () => {
    expect(verifySession("")).toBeNull();
  });

  it("SESSION_COOKIE is session", () => {
    expect(SESSION_COOKIE).toBe("session");
  });

  it("getSessionCookieOptions returns correct options", () => {
    const opts = getSessionCookieOptions();
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe("lax");
    expect(opts.maxAge).toBe(86400);
    expect(opts.path).toBe("/");
  });
});
