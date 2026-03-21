"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

type JobStatus = "queued" | "processing" | "done" | "failed" | "expired";

interface JobData {
  jobId: string;
  status: JobStatus;
  targetFormat: string;
  sourceFilename: string;
  createdAt: string;
  updatedAt: string;
  error: { code?: string; message: string } | null;
}

function JobPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const jobId = params.jobId as string;
  const token = searchParams.get("token");

  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setFetchError("Missing job ID");
      setLoading(false);
      return;
    }

    async function fetchStatus() {
      try {
        const query = token ? `?token=${encodeURIComponent(token)}` : "";
        const res = await fetch(`/api/jobs/${jobId}${query}`);
        const data = await res.json();

        if (!res.ok) {
          setFetchError(data.error || "Failed to load job");
          setLoading(false);
          return;
        }

        setJob(data);
      } catch {
        setFetchError("Network error");
        setLoading(false);
      }
    }

    fetchStatus();
    const interval = setInterval(fetchStatus, 2500);
    return () => clearInterval(interval);
  }, [jobId, token]);

  if (!jobId) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="card p-6 sm:p-8">
          <p className="font-medium" style={{ color: "var(--error)" }}>Missing job ID.</p>
          <Link href="/" className="btn-secondary mt-4 inline-block">
            Back to convert
          </Link>
        </div>
      </main>
    );
  }

  if (fetchError) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="card p-6 sm:p-8">
          <p className="font-medium" style={{ color: "var(--error)" }}>{fetchError}</p>
          <Link href="/" className="btn-secondary mt-4 inline-block">
            Back to convert
          </Link>
        </div>
      </main>
    );
  }

  if (loading && !job) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="card flex flex-col items-center justify-center p-12">
          <svg className="h-10 w-10 animate-spin" style={{ color: "var(--muted)" }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-4 font-medium" style={{ color: "var(--foreground)" }}>
            Loading conversion...
          </p>
        </div>
      </main>
    );
  }

  if (!job) return null;

  const isProcessing = job.status === "queued" || job.status === "processing";
  const downloadHref = token
    ? `/api/jobs/${jobId}/download?token=${encodeURIComponent(token)}`
    : `/api/jobs/${jobId}/download`;

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
        style={{ color: "var(--muted)" }}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to convert
      </Link>

      <div className="card overflow-hidden p-0">
        {/* Status header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="rounded-[var(--radius-md)] p-2"
              style={{ background: "var(--muted-bg)" }}
            >
              <svg className="h-5 w-5" style={{ color: "var(--muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="font-semibold" style={{ color: "var(--foreground)" }}>
                {job.sourceFilename}
              </h1>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                → {job.targetFormat.toUpperCase()} • {new Date(job.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
          <StatusBadge status={job.status} />
        </div>

        <div className="p-6">
          {isProcessing && (
            <div className="mb-6 flex items-center gap-3 rounded-[var(--radius-md)] p-4" style={{ background: "var(--muted-bg)" }}>
              <svg className="h-5 w-5 animate-spin" style={{ color: "var(--primary)" }} fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Your file is being converted. This page updates automatically.
              </p>
            </div>
          )}

          {job.status === "failed" && job.error && (
            <div
              className="mb-6 rounded-[var(--radius-md)] p-4 text-sm"
              style={{ background: "var(--error-bg)", color: "var(--error)" }}
            >
              {job.error.message}
            </div>
          )}

          {job.status === "expired" && (
            <p className="mb-6 text-sm" style={{ color: "var(--muted)" }}>
              File has been deleted. TTL expired.
            </p>
          )}

          {job.status === "done" && (
            <a
              href={downloadHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex w-full sm:w-auto"
            >
              <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </a>
          )}
        </div>
      </div>
    </main>
  );
}

export default function JobPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-2xl px-6 py-12">
          <div className="flex items-center justify-center py-16" style={{ color: "var(--muted)" }}>
            Loading...
          </div>
        </main>
      }
    >
      <JobPageContent />
    </Suspense>
  );
}
