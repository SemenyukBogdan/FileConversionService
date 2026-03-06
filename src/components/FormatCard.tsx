"use client";

type TargetFormat = "webp" | "pdf" | "json";

const FORMATS: { value: TargetFormat; label: string; desc: string; from: string }[] = [
  { value: "webp", label: "WebP", desc: "Modern image format", from: "PNG, JPG" },
  { value: "pdf", label: "PDF", desc: "Document format", from: "Markdown" },
  { value: "json", label: "JSON", desc: "Structured data", from: "CSV" },
];

interface FormatCardProps {
  value: TargetFormat;
  onChange: (value: TargetFormat) => void;
}

export function FormatCard({ value, onChange }: FormatCardProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {FORMATS.map((f) => (
        <button
          key={f.value}
          type="button"
          onClick={() => onChange(f.value)}
          className={`card flex flex-col items-start gap-1 p-4 text-left transition-all ${
            value === f.value
              ? "ring-2 ring-[var(--primary)] ring-offset-2"
              : ""
          }`}
        >
          <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
            {f.label}
          </span>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {f.desc} • from {f.from}
          </span>
        </button>
      ))}
    </div>
  );
}
