import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

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

function createRequest(path: string) {
  return new NextRequest(`http://localhost${path}`);
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
      status: "done",
      resultStorageKey: "2025-01/result.webp",
      resultMime: "image/webp",
      targetFormat: "webp",
      sourceFilename: "test.png",
    });
    mockGet.mockResolvedValue(buf);

    const req = createRequest("/api/jobs/abc-123/download?token=secret");
    const res = await GET(req, { params: Promise.resolve({ jobId: "abc-123" }) });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/webp");
    expect(res.headers.get("Content-Disposition")).toContain("test.webp");
  });
});
