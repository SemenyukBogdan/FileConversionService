import { describe, it, expect, vi } from "vitest";
import { POST } from "./route";

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      set: vi.fn(),
    })
  ),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
    },
  },
}));

vi.mock("@/lib/password", () => ({
  verifyPassword: vi.fn((password: string) => password === "correct"),
}));

describe("POST /api/auth/login", () => {
  it("returns 400 when email or password missing", async () => {
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 401 for invalid credentials", async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "wrong" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 200 for correct credentials", async () => {
    mockFindUnique.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      passwordHash: "hashed",
    });

    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", password: "correct" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
