"use client";

import { DOCUMENT_FORMATS, type DocumentFormat } from "@/lib/conversion-matrix";

const LABELS: Record<string, string> = {
  abw: "AbiWord",
  djvu: "DjVu",
  doc: "Word 97",
  docm: "Word (macro)",
  docx: "Word",
  dot: "Word template",
  dotx: "Word template",
  html: "HTML",
  lwp: "Lotus",
  md: "Markdown",
  odt: "OpenDocument",
  pdf: "PDF",
  rst: "reStructuredText",
  rtf: "RTF",
  tex: "LaTeX",
  txt: "Plain text",
  wpd: "WordPerfect",
  wps: "Works",
  zabw: "AbiWord (zip)",
};

interface FormatCardProps {
  value: DocumentFormat;
  onChange: (value: DocumentFormat) => void;
}

export function FormatCard({ value, onChange }: FormatCardProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-4 md:grid-cols-5">
      {DOCUMENT_FORMATS.map((f) => (
        <button
          key={f}
          type="button"
          onClick={() => onChange(f)}
          className={`card flex flex-col items-start gap-0.5 p-3 text-left transition-all ${
            value === f ? "ring-2 ring-[var(--primary)] ring-offset-2" : ""
          }`}
        >
          <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {LABELS[f] ?? f.toUpperCase()}
          </span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            .{f}
          </span>
        </button>
      ))}
    </div>
  );
}
