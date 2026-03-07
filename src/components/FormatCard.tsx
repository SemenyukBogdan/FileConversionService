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
      {DOCUMENT_FORMATS.map((f) => {
        const isSelected = value === f;
        return (
          <button
            key={f}
            type="button"
            onClick={() => onChange(f)}
            className={`card flex min-w-0 flex-col items-start gap-0.5 p-3 text-left transition-all duration-200 ${
              isSelected
                ? "ring-2 ring-[var(--primary)] ring-offset-2 border-[var(--primary)]"
                : "hover:border-[var(--border-hover)]"
            }`}
            style={isSelected ? { background: "var(--primary-subtle)" } : undefined}
          >
            <span className="w-full min-w-0 break-words text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              {LABELS[f] ?? f.toUpperCase()}
            </span>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              .{f}
            </span>
          </button>
        );
      })}
    </div>
  );
}
