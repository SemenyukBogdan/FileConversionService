"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function Header() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((d) => setAuthenticated(d.authenticated));
  }, []);

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80" style={{ borderColor: "var(--border)" }}>
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
          File Conversion
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: "var(--muted)" }}
          >
            Convert
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: "var(--muted)" }}
          >
            About
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: "var(--muted)" }}
          >
            Dashboard
          </Link>
          {authenticated ? (
            <button
              onClick={handleSignOut}
              className="btn-secondary text-sm"
            >
              Sign out
            </button>
          ) : (
            <>
              <Link
                href="/register"
                className="rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium transition-colors hover:opacity-90"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
              >
                Sign up
              </Link>
              <Link href="/login" className="btn-secondary text-sm">
                Sign in
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
