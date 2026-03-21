import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { createSession } from "@/lib/auth";

const { mockFindUnique, mockGet } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockGet: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    conversionJob: { findUnique: mockFindUnique },
  },
}));

vi.mock("@/lib/storage", () => ({
  getStorage: () => ({ get: mockGet }),
}));

function createRequest(path: string, sessionUserId?: string) {
  return new NextRequest(`http://localhost${path}`, {
    headers: sessionUserId
      ? { cookie: `session=${createSession(sessionUserId)}` }
      : undefined,
  });
}

describe("GET /api/jobs/[jobId]/download", () => {
  it("returns 404 when job not found", async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createRequest("/api/jobs/abc-123/download?token=secret");
    const res = await GET(req, { params: Promise.resolve({ jobId: "abc-123" }) });

    expect(res.status).toBe(404);
  });

  it("returns 403 for invalid token", async () => {
    mockFindUnique.mockResolvedValue({
      id: "abc-123",
      accessToken: "correct",
      userId: null,
      status: "done",
    });

    const req = createRequest("/api/jobs/abc-123/download?token=wrong");
    const res = await GET(req, { params: Promise.resolve({ jobId: "abc-123" }) });

    expect(res.status).toBe(403);
  });

  it("returns 410 when job expired", async () => {
    mockFindUnique.mockResolvedValue({
      id: "abc-123",
      accessToken: "secret",
      userId: null,
      status: "expired",
    });

    const req = createRequest("/api/jobs/abc-123/download?token=secret");
    const res = await GET(req, { params: Promise.resolve({ jobId: "abc-123" }) });

    expect(res.status).toBe(410);
  });

  it("returns 400 when job not done", async () => {
    mockFindUnique.mockResolvedValue({
      id: "abc-123",
      accessToken: "secret",
      userId: null,
      status: "processing",
    });

    const req = createRequest("/api/jobs/abc-123/download?token=secret");
    const res = await GET(req, { params: Promise.resolve({ jobId: "abc-123" }) });

    expect(res.status).toBe(400);
  });

  it("returns 200 with file for done job", async () => {
    const buf = Buffer.from("file content");
    mockFindUnique.mockResolvedValue({
      id: "abc-123",
      accessToken: "secret",
      userId: null,
      status: "done",
      resultStorageKey: "2025-01/result.pdf",
      resultMime: "application/pdf",
      targetFormat: "pdf",
      sourceFilename: "test.docx",
    });
    mockGet.mockResolvedValue(buf);

    const req = createRequest("/api/jobs/abc-123/download?token=secret");
    const res = await GET(req, { params: Promise.resolve({ jobId: "abc-123" }) });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toContain("test.pdf");
  });

  it("returns 403 for auth-owned job when session owner mismatches", async () => {
    mockFindUnique.mockResolvedValue({
      id: "abc-123",
      accessToken: "secret",
      userId: "11111111-1111-1111-1111-111111111111",
      status: "done",
      resultStorageKey: "2025-01/result.pdf",
      resultMime: "application/pdf",
      targetFormat: "pdf",
      sourceFilename: "test.docx",
    });

    const req = createRequest(
      "/api/jobs/abc-123/download?token=secret",
      "22222222-2222-2222-2222-222222222222"
    );
    const res = await GET(req, { params: Promise.resolve({ jobId: "abc-123" }) });

    expect(res.status).toBe(403);
  });

  it("returns 200 for auth-owned job when session owner matches", async () => {
    const buf = Buffer.from("file content");
    const ownerId = "11111111-1111-1111-1111-111111111111";
    mockFindUnique.mockResolvedValue({
      id: "abc-123",
      accessToken: "secret",
      userId: ownerId,
      status: "done",
      resultStorageKey: "2025-01/result.pdf",
      resultMime: "application/pdf",
      targetFormat: "pdf",
      sourceFilename: "test.docx",
    });
    mockGet.mockResolvedValue(buf);

    const req = createRequest("/api/jobs/abc-123/download", ownerId);
    const res = await GET(req, { params: Promise.resolve({ jobId: "abc-123" }) });

    expect(res.status).toBe(200);
  });
});
