import { describe, it, expect, vi } from "vitest";
import { POST } from "./route";

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      delete: vi.fn(),
    })
  ),
}));

describe("POST /api/auth/logout", () => {
  it("returns 200", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
  });
});
