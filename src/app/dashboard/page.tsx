"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then(() => setLoading(false));
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

      {/* Recent conversions placeholder */}
      <div className="card p-6">
        <h2 className="mb-4 font-semibold" style={{ color: "var(--foreground)" }}>
          Recent conversions
        </h2>
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
