import { describe, it, expect } from "vitest";
import {
  sanitizeFilename,
  validateFileForFormat,
  getExtensionForMime,
  MIME_WHITELIST,
  EXTENSION_MAP,
} from "./validation";

describe("sanitizeFilename", () => {
  it("replaces invalid chars with underscore", () => {
    expect(sanitizeFilename("file name.txt")).toBe("file_name.txt");
  });

  it("keeps allowed chars", () => {
    expect(sanitizeFilename("file-name_123.pdf")).toBe("file-name_123.pdf");
  });

  it("truncates to 255 chars", () => {
    const long = "a".repeat(300);
    expect(sanitizeFilename(long).length).toBe(255);
  });
});

describe("validateFileForFormat", () => {
  it("accepts png for webp", () => {
    expect(validateFileForFormat("image/png", "webp", 1000).valid).toBe(true);
  });

  it("accepts jpeg for webp", () => {
    expect(validateFileForFormat("image/jpeg", "webp", 1000).valid).toBe(true);
  });

  it("rejects wrong mime for webp", () => {
    const r = validateFileForFormat("text/plain", "webp", 1000);
    expect(r.valid).toBe(false);
    expect(r.error).toContain("Invalid file type");
  });

  it("accepts markdown for pdf", () => {
    expect(validateFileForFormat("text/markdown", "pdf", 1000).valid).toBe(true);
  });

  it("accepts csv for json", () => {
    expect(validateFileForFormat("text/csv", "json", 1000).valid).toBe(true);
  });

  it("rejects file too large", () => {
    const maxMb = 25;
    const r = validateFileForFormat("image/png", "webp", (maxMb + 1) * 1024 * 1024);
    expect(r.valid).toBe(false);
    expect(r.tooLarge).toBe(true);
  });
});

describe("getExtensionForMime", () => {
  it("returns .webp for png", () => {
    expect(getExtensionForMime("image/png", "webp")).toBe(".webp");
  });

  it("returns .pdf for markdown", () => {
    expect(getExtensionForMime("text/markdown", "pdf")).toBe(".pdf");
  });

  it("returns .json for csv", () => {
    expect(getExtensionForMime("text/csv", "json")).toBe(".json");
  });
});

describe("constants", () => {
  it("MIME_WHITELIST has webp pdf json", () => {
    expect(MIME_WHITELIST.webp).toContain("image/png");
    expect(MIME_WHITELIST.pdf).toContain("text/markdown");
    expect(MIME_WHITELIST.json).toContain("text/csv");
  });

  it("EXTENSION_MAP has correct extensions", () => {
    expect(EXTENSION_MAP.webp).toBe(".webp");
    expect(EXTENSION_MAP.pdf).toBe(".pdf");
    expect(EXTENSION_MAP.json).toBe(".json");
  });
});
