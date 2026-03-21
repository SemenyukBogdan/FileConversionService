import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, DELETE } from "./route";
import { createSession } from "@/lib/auth";

const { mockFindUnique, mockUpdate, mockDelete } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    conversionJob: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

vi.mock("@/lib/storage", () => ({
  getStorage: () => ({ delete: mockDelete }),
}));

function createRequest(path: string, sessionUserId?: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: sessionUserId
      ? { cookie: `session=${createSession(sessionUserId)}` }
      : undefined,
  });
}

describe("GET /api/jobs/[jobId]", () => {
  it("returns 404 when job not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createRequest("/api/jobs/abc-123?token=secret");
    const res = await GET(req, { params: Promise.resolve({ jobId: "abc-123" }) });

    expect(res.status).toBe(404);
  });

  it("returns 403 for invalid token", async () => {
    mockFindUnique.mockResolvedValue({
      id: "abc-123",
      accessToken: "correct-token",
      userId: null,
      status: "queued",
      targetFormat: "pdf",
      sourceFilename: "a.png",
      createdAt: new Date(),
      updatedAt: new Date(),
      errorMessage: null,
      errorCode: null,
    });

    const req = createRequest("/api/jobs/abc-123?token=wrong-token");
    const res = await GET(req, { params: Promise.resolve({ jobId: "abc-123" }) });

    expect(res.status).toBe(403);
  });

  it("returns 200 with job data for valid token", async () => {
    const job = {
      id: "abc-123",
      accessToken: "secret",
      userId: null,
      status: "done",
      targetFormat: "pdf",
      sourceFilename: "test.png",
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
      errorMessage: null,
      errorCode: null,
    };
    mockFindUnique.mockResolvedValue(job);

    const req = createRequest("/api/jobs/abc-123?token=secret");
    const res = await GET(req, { params: Promise.resolve({ jobId: "abc-123" }) });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.jobId).toBe("abc-123");
    expect(data.status).toBe("done");
  });

  it("returns 403 for auth-owned job when session owner mismatches", async () => {
    mockFindUnique.mockResolvedValue({
      id: "abc-123",
      accessToken: "secret",
      userId: "11111111-1111-1111-1111-111111111111",
      status: "done",
      targetFormat: "pdf",
      sourceFilename: "test.png",
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
      errorMessage: null,
      errorCode: null,
    });

    const req = createRequest(
      "/api/jobs/abc-123?token=secret",
      "22222222-2222-2222-2222-222222222222"
    );
    const res = await GET(req, { params: Promise.resolve({ jobId: "abc-123" }) });

    expect(res.status).toBe(403);
  });

  it("returns 200 for auth-owned job when session owner matches", async () => {
    const ownerId = "11111111-1111-1111-1111-111111111111";
    mockFindUnique.mockResolvedValue({
      id: "abc-123",
      accessToken: "secret",
      userId: ownerId,
      status: "done",
      targetFormat: "pdf",
      sourceFilename: "test.png",
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
      errorMessage: null,
      errorCode: null,
    });

    const req = createRequest("/api/jobs/abc-123", ownerId);
    const res = await GET(req, { params: Promise.resolve({ jobId: "abc-123" }) });

    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/jobs/[jobId]", () => {
  it("returns 404 when job not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createRequest("/api/jobs/abc-123?token=secret");
    const res = await DELETE(req, { params: Promise.resolve({ jobId: "abc-123" }) });

    expect(res.status).toBe(404);
  });

  it("returns 403 for invalid token", async () => {
    mockFindUnique.mockResolvedValue({
      id: "abc-123",
      accessToken: "correct",
      userId: null,
      status: "queued",
      sourceStorageKey: "x",
      resultStorageKey: null,
    });

    const req = createRequest("/api/jobs/abc-123?token=wrong");
    const res = await DELETE(req, { params: Promise.resolve({ jobId: "abc-123" }) });

    expect(res.status).toBe(403);
  });

  it("returns 200 when job expired", async () => {
    mockFindUnique.mockResolvedValue({
      id: "abc-123",
      accessToken: "secret",
      userId: null,
      status: "expired",
      sourceStorageKey: "x",
      resultStorageKey: null,
    });

    const req = createRequest("/api/jobs/abc-123?token=secret");
    const res = await DELETE(req, { params: Promise.resolve({ jobId: "abc-123" }) });

    expect(res.status).toBe(200);
  });

  it("returns 403 for auth-owned job when session missing", async () => {
    mockFindUnique.mockResolvedValue({
      id: "abc-123",
      accessToken: "secret",
      userId: "11111111-1111-1111-1111-111111111111",
      status: "queued",
      sourceStorageKey: "x",
      resultStorageKey: null,
    });

    const req = createRequest("/api/jobs/abc-123");
    const res = await DELETE(req, { params: Promise.resolve({ jobId: "abc-123" }) });

    expect(res.status).toBe(403);
  });
});
