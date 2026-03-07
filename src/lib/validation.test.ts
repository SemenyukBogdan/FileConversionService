import { describe, it, expect } from "vitest";
import {
  sanitizeFilename,
  validateDocumentConversion,
  getExtensionForTarget,
  getSourceFormatFromMime,
} from "./validation";

describe("sanitizeFilename", () => {
  it("замінює заборонені символи на _", () => {
    expect(sanitizeFilename("file name.txt")).toBe("file_name.txt");
  });

  it("зберігає дозволені символи", () => {
    expect(sanitizeFilename("file-name_123.pdf")).toBe("file-name_123.pdf");
  });

  it("обрізає до 255 символів", () => {
    const long = "a".repeat(300);
    expect(sanitizeFilename(long).length).toBe(255);
  });
});

describe("validateDocumentConversion", () => {
  it("приймає docx -> pdf", () => {
    expect(validateDocumentConversion("docx", "pdf", 1000).valid).toBe(true);
  });

  it("приймає md -> pdf", () => {
    expect(validateDocumentConversion("md", "pdf", 1000).valid).toBe(true);
  });

  it("відхиляє непідтримувану пару", () => {
    const r = validateDocumentConversion("doc", "md", 1000);
    expect(r.valid).toBe(false);
    expect(r.error).toContain("не підтримується");
  });

  it("відхиляє однакові формати", () => {
    const r = validateDocumentConversion("pdf", "pdf", 1000);
    expect(r.valid).toBe(false);
  });

  it("відхиляє завеликий файл", () => {
    const maxMb = 25;
    const r = validateDocumentConversion("docx", "pdf", (maxMb + 1) * 1024 * 1024);
    expect(r.valid).toBe(false);
    expect(r.tooLarge).toBe(true);
  });
});

describe("getExtensionForTarget", () => {
  it("повертає .pdf для pdf", () => {
    expect(getExtensionForTarget("pdf")).toBe(".pdf");
  });

  it("повертає .docx для docx", () => {
    expect(getExtensionForTarget("docx")).toBe(".docx");
  });

  it("повертає .md для md", () => {
    expect(getExtensionForTarget("md")).toBe(".md");
  });
});

describe("getSourceFormatFromMime", () => {
  it("визначає docx з mime", () => {
    expect(getSourceFormatFromMime("application/vnd.openxmlformats-officedocument.wordprocessingml.document")).toBe("docx");
  });

  it("визначає pdf з mime", () => {
    expect(getSourceFormatFromMime("application/pdf")).toBe("pdf");
  });

  it("повертає null для невідомого mime", () => {
    expect(getSourceFormatFromMime("application/unknown")).toBe(null);
  });
});
