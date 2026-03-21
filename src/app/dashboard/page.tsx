"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type JobListItem = {
  jobId: string;
  status: "queued" | "processing" | "done" | "failed" | "expired";
  sourceFilename: string;
  targetFormat: string;
  createdAt: string;
  updatedAt: string;
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();

        if (!session.authenticated) {
          window.location.href = "/login?from=%2Fdashboard";
          return;
        }

        const jobsRes = await fetch("/api/jobs");
        if (!jobsRes.ok) {
          const payload = await jobsRes.json().catch(() => ({}));
          throw new Error(payload.error || "Failed to load conversions");
        }

        const payload = (await jobsRes.json()) as { items?: JobListItem[] };
        if (!cancelled) {
          setJobs(payload.items ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load conversions");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadJobs();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center gap-3" style={{ color: "var(--muted)" }}>
          <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--foreground)" }}>
          Dashboard
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Manage your conversions and quick actions
        </p>
      </div>

      {/* Quick actions */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <Link href="/" className="card group block p-6">
          <div className="flex items-start gap-4">
            <div
              className="rounded-[var(--radius-md)] p-3 transition-colors"
              style={{ background: "var(--primary)", color: "white" }}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>
                Convert a file
              </h2>
              <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>
                Upload and convert to WebP, PDF, or JSON
              </p>
            </div>
            <span className="ml-auto text-[var(--muted)] group-hover:text-[var(--primary)]">→</span>
          </div>
        </Link>

        <Link href="/about" className="card group block p-6">
          <div className="flex items-start gap-4">
            <div
              className="rounded-[var(--radius-md)] p-3"
              style={{ background: "var(--muted-bg)", color: "var(--muted)" }}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold" style={{ color: "var(--foreground)" }}>
                About the service
              </h2>
              <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>
                Supported formats and how it works
              </p>
            </div>
            <span className="ml-auto text-[var(--muted)] group-hover:text-[var(--primary)]">→</span>
          </div>
        </Link>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 font-semibold" style={{ color: "var(--foreground)" }}>
          Recent conversions
        </h2>
        {error ? (
          <div
            className="rounded-[var(--radius-md)] p-4 text-sm"
            style={{ background: "var(--error-bg)", color: "var(--error)" }}
          >
            {error}
          </div>
        ) : jobs.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-[var(--radius-md)] border-2 border-dashed py-12"
            style={{ borderColor: "var(--border)" }}
          >
            <svg className="h-10 w-10" style={{ color: "var(--muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-3 text-sm font-medium" style={{ color: "var(--foreground)" }}>
              No conversions yet
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              Convert a file to see it here
            </p>
            <Link href="/" className="btn-secondary mt-4">
              Convert now
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Link
                key={job.jobId}
                href={`/jobs/${job.jobId}`}
                className="block rounded-[var(--radius-md)] border p-4 transition-colors hover:bg-[var(--muted-bg)]/40"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      {job.sourceFilename}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--muted)" }}>
                      Target: {job.targetFormat.toUpperCase()} • {new Date(job.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-medium capitalize"
                    style={{
                      background:
                        job.status === "done"
                          ? "var(--success-bg)"
                          : job.status === "failed"
                            ? "var(--error-bg)"
                            : "var(--muted-bg)",
                      color:
                        job.status === "done"
                          ? "var(--success)"
                          : job.status === "failed"
                            ? "var(--error)"
                            : "var(--muted)",
                    }}
                  >
                    {job.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-10">
        <button
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/";
          }}
          className="btn-secondary"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
