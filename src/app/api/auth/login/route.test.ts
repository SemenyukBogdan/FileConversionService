import { describe, it, expect, vi } from "vitest";
import { POST } from "./route";

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      set: vi.fn(),
    })
  ),
}));

describe("POST /api/auth/login", () => {
  it("returns 401 for wrong password", async () => {
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "wrong" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 200 for correct password", async () => {
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "demo123" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
