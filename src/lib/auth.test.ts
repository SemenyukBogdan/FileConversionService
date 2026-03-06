import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createSession,
  verifySession,
  getSessionCookieOptions,
  SESSION_COOKIE,
} from "./auth";

describe("auth", () => {
  it("createSession returns ok", () => {
    expect(createSession()).toBe("ok");
  });

  it("verifySession returns true for ok", () => {
    expect(verifySession("ok")).toBe(true);
  });

  it("verifySession returns false for wrong value", () => {
    expect(verifySession("wrong")).toBe(false);
  });

  it("verifySession returns false for undefined", () => {
    expect(verifySession(undefined)).toBe(false);
  });

  it("verifySession returns false for empty string", () => {
    expect(verifySession("")).toBe(false);
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
