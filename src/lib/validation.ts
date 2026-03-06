export type TargetFormat = "webp" | "pdf" | "json";

export const MIME_WHITELIST: Record<TargetFormat, string[]> = {
  webp: ["image/png", "image/jpeg"],
  pdf: ["text/markdown", "text/plain"],
  json: ["text/csv", "application/csv", "text/plain"],
};

export const EXTENSION_MAP: Record<string, string> = {
  webp: ".webp",
  pdf: ".pdf",
  json: ".json",
};

export function getMaxFileSizeBytes(): number {
  const mb = parseInt(process.env.MAX_FILE_SIZE_MB || "25", 10);
  return mb * 1024 * 1024;
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 255);
}

export function validateFileForFormat(
  mimeType: string,
  targetFormat: TargetFormat,
  size: number
): { valid: boolean; error?: string; tooLarge?: boolean } {
  const allowedMimes = MIME_WHITELIST[targetFormat];
  if (!allowedMimes.includes(mimeType)) {
    return {
      valid: false,
      error: `Invalid file type for ${targetFormat}. Allowed: ${allowedMimes.join(", ")}`,
    };
  }

  const maxSize = getMaxFileSizeBytes();
  if (size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${process.env.MAX_FILE_SIZE_MB || 25}MB`,
      tooLarge: true,
    };
  }

  return { valid: true };
}

export function getExtensionForMime(mime: string, targetFormat: TargetFormat): string {
  const ext = EXTENSION_MAP[targetFormat];
  if (targetFormat === "pdf" && (mime === "text/markdown" || mime === "text/plain")) {
    return ext;
  }
  if (targetFormat === "webp" && (mime === "image/png" || mime === "image/jpeg")) {
    return ext;
  }
  if (targetFormat === "json") {
    return ext;
  }
  return ext;
}
