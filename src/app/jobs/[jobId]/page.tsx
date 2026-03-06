"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

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
    if (!jobId || !token) {
      setFetchError("Missing job ID or token");
      setLoading(false);
      return;
    }

    async function fetchStatus() {
      try {
        const res = await fetch(`/api/jobs/${jobId}?token=${encodeURIComponent(token!)}`);
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

  useEffect(() => {
    if (job?.status === "done" || job?.status === "failed" || job?.status === "expired") {
      setLoading(false);
    }
  }, [job?.status]);

  if (!token || !jobId) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
        <p className="text-red-600 dark:text-red-400">Missing job ID or token.</p>
        <Link href="/" className="mt-4 inline-block text-zinc-600 underline dark:text-zinc-400">
          Back to upload
        </Link>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
        <p className="text-red-600 dark:text-red-400">{fetchError}</p>
        <Link href="/" className="mt-4 inline-block text-zinc-600 underline dark:text-zinc-400">
          Back to upload
        </Link>
      </div>
    );
  }

  if (loading && !job) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
        <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  const statusLabels: Record<JobStatus, string> = {
    queued: "Queued",
    processing: "Processing",
    done: "Done",
    failed: "Failed",
    expired: "Expired",
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Link href="/" className="text-zinc-600 underline dark:text-zinc-400">
          Back to upload
        </Link>

        <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {job.sourceFilename}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Target: {job.targetFormat.toUpperCase()} • Created:{" "}
            {new Date(job.createdAt).toLocaleString()}
          </p>

          <div className="mt-6">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                job.status === "done"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : job.status === "failed"
                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    : job.status === "expired"
                      ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
              }`}
            >
              {statusLabels[job.status]}
            </span>
          </div>

          {job.status === "failed" && job.error && (
            <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {job.error.message}
            </div>
          )}

          {job.status === "expired" && (
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">
              File has been deleted. TTL expired.
            </p>
          )}

          {job.status === "done" && (
            <a
              href={`/api/jobs/${jobId}/download?token=${encodeURIComponent(token)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              Download
            </a>
          )}
        </div>
      </main>
    </div>
  );
}

export default function JobPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-16">Loading...</div>}>
      <JobPageContent />
    </Suspense>
  );
}
