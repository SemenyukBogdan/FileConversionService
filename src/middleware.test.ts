import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { createSession } from "@/lib/auth";
import { middleware } from "./middleware";

function createRequest(path: string, cookieValue?: string): NextRequest {
  const url = "http://localhost:3000" + path;
  const headers = new Headers();
  if (cookieValue !== undefined) {
    headers.set("cookie", `session=${cookieValue}`);
  }
  return new NextRequest(url, { headers });
}

describe("middleware", () => {
  it("allows access to dashboard with valid session", () => {
    const token = createSession("550e8400-e29b-41d4-a716-446655440000");
    const req = createRequest("/dashboard", token);
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it("redirects to login when no session for dashboard", () => {
    const req = createRequest("/dashboard");
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
    expect(res.headers.get("location")).toContain("from=%2Fdashboard");
  });

  it("redirects when wrong session for dashboard", () => {
    const req = createRequest("/dashboard", "wrong");
    const res = middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("allows access to non-protected paths", () => {
    const req = createRequest("/");
    const res = middleware(req);
    expect(res.status).toBe(200);
  });

  it("allows access to /about without session", () => {
    const req = createRequest("/about");
    const res = middleware(req);
    expect(res.status).toBe(200);
  });
});
