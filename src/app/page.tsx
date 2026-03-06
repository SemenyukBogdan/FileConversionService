"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [targetFormat, setTargetFormat] = useState<"webp" | "pdf" | "json">("webp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          File Conversion Service
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Upload a file and convert it to WebP, PDF, or JSON. Processing runs asynchronously.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          <div>
            <label
              htmlFor="file"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              File
            </label>
            <input
              id="file"
              type="file"
              accept=".png,.jpg,.jpeg,.md,.csv,.txt"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <p className="mt-1 text-xs text-zinc-500">
              PNG/JPG for WebP; Markdown for PDF; CSV for JSON. Max 25MB.
            </p>
          </div>

          <div>
            <label
              htmlFor="format"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Target format
            </label>
            <select
              id="format"
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value as "webp" | "pdf" | "json")}
              className="mt-2 block w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="webp">WebP (from PNG/JPG)</option>
              <option value="pdf">PDF (from Markdown)</option>
              <option value="json">JSON (from CSV)</option>
            </select>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {loading ? "Creating..." : "Convert"}
          </button>
        </form>
      </main>
    </div>
  );
}
