"use client";

import { useCallback, useState } from "react";

interface UploadZoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept: string;
  maxSizeMB?: number;
}

export function UploadZone({ file, onFileChange, accept, maxSizeMB = 25 }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) onFileChange(dropped);
    },
    [onFileChange]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileChange(e.target.files?.[0] ?? null);
  };

  return (
    <label
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed transition-all duration-200 ${
        isDragging ? "border-[var(--primary)] bg-blue-50/50" : "border-[var(--border)] bg-white hover:border-[var(--border-hover)] hover:bg-[var(--muted-bg)]/30"
      }`}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />
      {file ? (
        <div className="flex flex-col items-center gap-2 px-6 text-center">
          <div className="rounded-full bg-emerald-100 p-3">
            <svg className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-medium" style={{ color: "var(--foreground)" }}>{file.name}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {(file.size / 1024).toFixed(1)} KB • Click or drag to replace
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 px-6 text-center">
          <div className="rounded-full p-3" style={{ background: "var(--muted-bg)" }}>
            <svg className="h-8 w-8" style={{ color: "var(--muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <p className="font-medium" style={{ color: "var(--foreground)" }}>
              Drop your file here, or <span className="text-[var(--primary)]">browse</span>
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Max {maxSizeMB}MB • PNG, JPG, MD, CSV, TXT
            </p>
          </div>
        </div>
      )}
    </label>
  );
}
