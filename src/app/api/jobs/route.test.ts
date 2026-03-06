import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

const { mockCreate, mockPut } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockPut: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { conversionJob: { create: mockCreate } },
}));

vi.mock("@/lib/storage", () => ({
  getStorage: () => ({ put: mockPut }),
  generateStorageKey: (ext: string) => `2025-01/test-id${ext}`,
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true }),
}));

vi.mock("@/lib/queue", () => ({
  addJobToQueue: vi.fn().mockResolvedValue("job-1"),
}));

describe("POST /api/jobs", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { checkRateLimit } = await import("@/lib/rate-limit");
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true });
  });

  it("returns 400 when file is missing", async () => {
    const formData = new FormData();
    formData.append("targetFormat", "webp");
    const req = new Request("http://localhost/api/jobs", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Missing");
  });

  it("returns 400 when targetFormat is missing", async () => {
    const formData = new FormData();
    formData.append("file", new Blob(["x"], { type: "image/png" }), "test.png");
    const req = new Request("http://localhost/api/jobs", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid targetFormat", async () => {
    const formData = new FormData();
    formData.append("file", new Blob(["x"], { type: "image/png" }), "test.png");
    formData.append("targetFormat", "invalid");
    const req = new Request("http://localhost/api/jobs", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Allowed");
  });

  it("returns 400 for invalid mime type", async () => {
    const formData = new FormData();
    formData.append("file", new Blob(["x"], { type: "text/plain" }), "test.txt");
    formData.append("targetFormat", "webp");
    const req = new Request("http://localhost/api/jobs", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 429 when rate limited", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false });

    const formData = new FormData();
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    formData.append("file", new Blob([pngHeader], { type: "image/png" }), "test.png");
    formData.append("targetFormat", "webp");

    const req = new Request("http://localhost/api/jobs", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it("returns 201 for valid PNG to WebP", async () => {
    mockCreate.mockResolvedValue({});

    const formData = new FormData();
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    formData.append("file", new Blob([pngHeader], { type: "image/png" }), "test.png");
    formData.append("targetFormat", "webp");

    const req = new Request("http://localhost/api/jobs", {
      method: "POST",
      body: formData,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.jobId).toBeDefined();
    expect(data.accessToken).toBeDefined();
    expect(data.status).toBe("queued");
  });
});
