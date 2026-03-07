"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/UploadZone";
import { FormatCard } from "@/components/FormatCard";
import { getAllowedSources } from "@/lib/conversion-matrix";
import { getExtensionForTarget } from "@/lib/validation";
import type { DocumentFormat } from "@/lib/conversion-matrix";

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<DocumentFormat>("pdf");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accept = useMemo(() => {
    const sources = getAllowedSources(targetFormat);
    return sources.map((f) => getExtensionForTarget(f)).join(",");
  }, [targetFormat]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetFormat", targetFormat);

      const res = await fetch("/api/jobs", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create job");
        setLoading(false);
        return;
      }

      router.push(`/jobs/${data.jobId}?token=${encodeURIComponent(data.accessToken)}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <div className="mb-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--foreground)" }}>
          Convert files in seconds
        </h1>
        <p className="mt-3 text-lg" style={{ color: "var(--muted)" }}>
          Upload → Convert → Download. Fast, secure, and runs in your browser.
        </p>
      </div>

      <div className="card p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="mb-3 block text-sm font-medium" style={{ color: "var(--foreground)" }}>
              1. Choose your file
            </label>
            <UploadZone
              file={file}
              onFileChange={(f) => {
                setFile(f);
                setError(null);
              }}
              accept={accept}
              maxSizeMB={25}
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium" style={{ color: "var(--foreground)" }}>
              2. Select target format
            </label>
            <FormatCard value={targetFormat} onChange={setTargetFormat} />
          </div>

          {error && (
            <div
              className="rounded-[var(--radius-md)] p-4 text-sm"
              style={{ background: "var(--error-bg)", color: "var(--error)" }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !file}
            className="btn-primary w-full py-3.5 text-base"
          >
            {loading ? "Creating conversion..." : "Convert now"}
          </button>
        </form>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm" style={{ color: "var(--muted)" }}>
        <span className="flex items-center gap-1.5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Secure processing
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Max 25MB per file
        </span>
        <span className="flex items-center gap-1.5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Async conversion
        </span>
      </div>
    </main>
  );
}
