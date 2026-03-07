import { isConversionSupported } from "./conversion-matrix";

// реекспорт для зручності
export { getSourceFormatFromMime, getExtensionForTarget } from "./conversion-matrix";

export function getMaxFileSizeBytes(): number {
  const mb = parseInt(process.env.MAX_FILE_SIZE_MB || "25", 10);
  return mb * 1024 * 1024;
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 255);
}

// валідація пари source->target та розміру
export function validateDocumentConversion(
  sourceFormat: string,
  targetFormat: string,
  size: number
): { valid: boolean; error?: string; tooLarge?: boolean } {
  if (!isConversionSupported(sourceFormat, targetFormat)) {
    return {
      valid: false,
      error: `Конвертація ${sourceFormat} → ${targetFormat} не підтримується`,
    };
  }

  const maxSize = getMaxFileSizeBytes();
  if (size > maxSize) {
    return {
      valid: false,
      error: `Файл завеликий. Максимум: ${process.env.MAX_FILE_SIZE_MB || 25}MB`,
      tooLarge: true,
    };
  }

  return { valid: true };
}
