import { describe, it, expect, vi } from "vitest";
import { GET } from "./route";

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: vi.fn(() => undefined),
    })
  ),
}));

describe("GET /api/auth/session", () => {
  it("returns json with authenticated field", async () => {
    const res = await GET();
    expect(res.headers.get("content-type")).toContain("application/json");
    const data = await res.json();
    expect(data).toHaveProperty("authenticated");
    expect(typeof data.authenticated).toBe("boolean");
  });
});
