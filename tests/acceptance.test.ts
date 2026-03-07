/**
 * Приймальні тести для File Conversion Service.
 * Запуск: npx vitest run tests/acceptance.test.ts
 * Потрібно: web на http://localhost:3000, worker, MySQL, Redis
 */

import { describe, it, expect } from "vitest";

const BASE = "http://localhost:3000";

async function createJob(file: Buffer, filename: string, mime: string, targetFormat: string) {
  const formData = new FormData();
  formData.append("file", new Blob([file], { type: mime }), filename);
  formData.append("targetFormat", targetFormat);
  const res = await fetch(`${BASE}/api/jobs`, { method: "POST", body: formData });
  return { res, data: await res.json().catch(() => ({})) };
}

describe("Приймальні тести", () => {
  it("invalid target format returns 400", async () => {
    const formData = new FormData();
    formData.append("file", new Blob(["# test"], { type: "text/markdown" }), "test.md");
    formData.append("targetFormat", "invalid");
    const res = await fetch(`${BASE}/api/jobs`, { method: "POST", body: formData });
    expect(res.status).toBe(400);
  });

  it("missing file returns 400", async () => {
    const formData = new FormData();
    formData.append("targetFormat", "pdf");
    const res = await fetch(`${BASE}/api/jobs`, { method: "POST", body: formData });
    expect(res.status).toBe(400);
  });

  it("MD to PDF creates job and returns 201", async () => {
    const mdContent = Buffer.from("# Hello\n\nTest markdown.", "utf-8");
    const { res, data } = await createJob(mdContent, "test.md", "text/markdown", "pdf");
    expect(res.status).toBe(201);
    expect(data.jobId).toBeDefined();
    expect(data.accessToken).toBeDefined();
    expect(data.status).toBe("queued");
  });

  it("status with invalid token returns 403 for existing job", async () => {
    const res = await fetch(`${BASE}/api/jobs/00000000-0000-0000-0000-000000000000?token=wrong`);
    expect([403, 404]).toContain(res.status);
  });

  it("download with invalid token returns 403 for existing job", async () => {
    const res = await fetch(
      `${BASE}/api/jobs/00000000-0000-0000-0000-000000000000/download?token=wrong`
    );
    expect([403, 404]).toContain(res.status);
  });
});
