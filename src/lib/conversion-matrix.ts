/**
 * Conversion matrix for document formats.
 * Maps source/target format pairs to the converter (LibreOffice, Pandoc, or DjVuLibre).
 */

export type Converter = "libreoffice" | "pandoc" | "djvulibre";

/** All supported document formats (19 formats, excluding PAGES, HWP) */
export const DOCUMENT_FORMATS = [
  "abw",
  "djvu",
  "doc",
  "docm",
  "docx",
  "dot",
  "dotx",
  "html",
  "lwp",
  "md",
  "odt",
  "pdf",
  "rst",
  "rtf",
  "tex",
  "txt",
  "wpd",
  "wps",
  "zabw",
] as const;

export type DocumentFormat = (typeof DOCUMENT_FORMATS)[number];

/** Formats supported by LibreOffice (office documents) */
const LIBREOFFICE_FORMATS: DocumentFormat[] = [
  "abw",
  "doc",
  "docm",
  "docx",
  "dot",
  "dotx",
  "html",
  "lwp",
  "odt",
  "pdf",
  "rtf",
  "txt",
  "wpd",
  "wps",
  "zabw",
];

/** Formats supported by Pandoc (markup and text) */
const PANDOC_FORMATS: DocumentFormat[] = [
  "docx",
  "html",
  "md",
  "odt",
  "pdf",
  "rst",
  "rtf",
  "tex",
  "txt",
];

/** MIME type to format mapping (lowercase keys) */
export const MIME_TO_FORMAT: Record<string, DocumentFormat> = {
  "application/x-abiword": "abw",
  "application/x-abw": "abw",
  "image/vnd.djvu": "djvu",
  "application/vnd.ms-word": "doc",
  "application/msword": "doc",
  "application/vnd.ms-word.document.macroEnabled.12": "docm",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-word.template": "dot",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template": "dotx",
  "text/html": "html",
  "application/x-lwp": "lwp",
  "text/markdown": "md",
  "application/vnd.oasis.opendocument.text": "odt",
  "application/pdf": "pdf",
  "text/x-rst": "rst",
  "text/prs.lines.tag": "rst",
  "application/rtf": "rtf",
  "text/rtf": "rtf",
  "application/x-tex": "tex",
  "text/x-tex": "tex",
  "text/plain": "txt",
  "application/vnd.wordperfect": "wpd",
  "application/vnd.ms-works": "wps",
  "application/x-zabw": "zabw",
};

/** Format to file extension mapping */
export const FORMAT_TO_EXT: Record<DocumentFormat, string> = {
  abw: ".abw",
  djvu: ".djvu",
  doc: ".doc",
  docm: ".docm",
  docx: ".docx",
  dot: ".dot",
  dotx: ".dotx",
  html: ".html",
  lwp: ".lwp",
  md: ".md",
  odt: ".odt",
  pdf: ".pdf",
  rst: ".rst",
  rtf: ".rtf",
  tex: ".tex",
  txt: ".txt",
  wpd: ".wpd",
  wps: ".wps",
  zabw: ".zabw",
};

/** Format to MIME type mapping */
export const FORMAT_TO_MIME: Record<DocumentFormat, string> = {
  abw: "application/x-abiword",
  djvu: "image/vnd.djvu",
  doc: "application/msword",
  docm: "application/vnd.ms-word.document.macroEnabled.12",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  dot: "application/vnd.ms-word.template",
  dotx: "application/vnd.openxmlformats-officedocument.wordprocessingml.template",
  html: "text/html",
  lwp: "application/x-lwp",
  md: "text/markdown",
  odt: "application/vnd.oasis.opendocument.text",
  pdf: "application/pdf",
  rst: "text/x-rst",
  rtf: "application/rtf",
  tex: "application/x-tex",
  txt: "text/plain",
  wpd: "application/vnd.wordperfect",
  wps: "application/vnd.ms-works",
  zabw: "application/x-zabw",
};

/**
 * Returns the converter to use for a given source/target format pair.
 * Returns null if conversion is not supported or if source equals target.
 */
export function getConverter(
  sourceFormat: string,
  targetFormat: string
): Converter | null {
  const source = sourceFormat.toLowerCase() as DocumentFormat;
  const target = targetFormat.toLowerCase() as DocumentFormat;

  if (source === target) return null;

  if (!DOCUMENT_FORMATS.includes(source) || !DOCUMENT_FORMATS.includes(target)) {
    return null;
  }

  // DjVuLibre: only djvu <-> pdf
  if ((source === "djvu" && target === "pdf") || (source === "pdf" && target === "djvu")) {
    return "djvulibre";
  }

  // Pandoc: when either format is markup (md, rst, tex) — Pandoc handles these best
  const isMarkupFormat = (f: string) => ["md", "rst", "tex"].includes(f);
  if (isMarkupFormat(source) || isMarkupFormat(target)) {
    if (PANDOC_FORMATS.includes(source) && PANDOC_FORMATS.includes(target)) {
      return "pandoc";
    }
    return null;
  }

  // LibreOffice: all other office document pairs
  if (LIBREOFFICE_FORMATS.includes(source) && LIBREOFFICE_FORMATS.includes(target)) {
    return "libreoffice";
  }

  return null;
}

/**
 * Returns all source formats that can be converted to the given target format.
 */
export function getAllowedSources(targetFormat: string): DocumentFormat[] {
  const target = targetFormat.toLowerCase();
  return DOCUMENT_FORMATS.filter(
    (source) => source !== target && getConverter(source, target) !== null
  );
}

/**
 * Returns all target formats that the given source format can be converted to.
 */
export function getAllowedTargets(sourceFormat: string): DocumentFormat[] {
  const source = sourceFormat.toLowerCase();
  return DOCUMENT_FORMATS.filter(
    (target) => source !== target && getConverter(source, target) !== null
  );
}

/**
 * Resolves source format from MIME type or file extension.
 * Returns null if format cannot be determined.
 */
export function getSourceFormatFromMime(mime: string): DocumentFormat | null {
  const normalized = mime.toLowerCase().trim();
  return MIME_TO_FORMAT[normalized] ?? null;
}

/**
 * Resolves source format from file extension (e.g. ".docx" or "file.docx").
 */
export function getSourceFormatFromExtension(filenameOrExt: string): DocumentFormat | null {
  const ext = filenameOrExt.toLowerCase().startsWith(".")
    ? filenameOrExt.toLowerCase()
    : "." + filenameOrExt.split(".").pop()?.toLowerCase();
  const entry = Object.entries(FORMAT_TO_EXT).find(([, e]) => e === ext);
  return entry ? (entry[0] as DocumentFormat) : null;
}

/**
 * Returns the file extension for a target format (e.g. ".pdf").
 */
export function getExtensionForTarget(targetFormat: string): string {
  const format = targetFormat.toLowerCase() as DocumentFormat;
  return FORMAT_TO_EXT[format] ?? `.${targetFormat}`;
}

/**
 * Checks if a conversion from source to target is supported.
 */
export function isConversionSupported(sourceFormat: string, targetFormat: string): boolean {
  return getConverter(sourceFormat, targetFormat) !== null;
}
