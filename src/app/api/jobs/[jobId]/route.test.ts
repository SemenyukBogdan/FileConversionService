import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET, DELETE } from "./route";

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

function createRequest(path: string) {
  return new NextRequest(`http://localhost${path}`);
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
      status: "expired",
      sourceStorageKey: "x",
      resultStorageKey: null,
    });

    const req = createRequest("/api/jobs/abc-123?token=secret");
    const res = await DELETE(req, { params: Promise.resolve({ jobId: "abc-123" }) });

    expect(res.status).toBe(200);
  });
});
