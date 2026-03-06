import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          About File Conversion Service
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          This service converts files asynchronously. Supported conversions:
        </p>
        <ul className="mt-4 list-inside list-disc space-y-2 text-zinc-600 dark:text-zinc-400">
          <li>PNG/JPG → WebP</li>
          <li>Markdown → PDF</li>
          <li>CSV → JSON</li>
        </ul>
        <p className="mt-6 text-zinc-600 dark:text-zinc-400">
          Upload a file, get a job ID, and poll for status. When done, download the result.
        </p>

        <div className="mt-10 flex gap-4">
          <Link
            href="/"
            className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Convert a file
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-zinc-700 dark:border-zinc-600 dark:text-zinc-300"
          >
            Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
