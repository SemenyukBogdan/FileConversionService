import Link from "next/link";

const CONVERSIONS = [
  { from: "PNG, JPG", to: "WebP", desc: "Optimize images for the web" },
  { from: "Markdown", to: "PDF", desc: "Create documents from markdown" },
  { from: "CSV", to: "JSON", desc: "Transform tabular data" },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-12">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--foreground)" }}>
          About File Conversion
        </h1>
        <p className="mt-3 text-lg" style={{ color: "var(--muted)" }}>
          Fast, secure file conversion in your browser. No sign-up required to convert.
        </p>
      </div>

      <div className="space-y-10">
        {/* How it works */}
        <section>
          <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--foreground)" }}>
            How it works
          </h2>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold" style={{ background: "var(--primary)", color: "white" }}>
              1
            </div>
            <div>
              <p className="font-medium" style={{ color: "var(--foreground)" }}>Upload</p>
              <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>Select your file and target format</p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold" style={{ background: "var(--muted-bg)", color: "var(--muted)" }}>
              2
            </div>
            <div>
              <p className="font-medium" style={{ color: "var(--foreground)" }}>Convert</p>
              <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>Processing runs asynchronously in the background</p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold" style={{ background: "var(--muted-bg)", color: "var(--muted)" }}>
              3
            </div>
            <div>
              <p className="font-medium" style={{ color: "var(--foreground)" }}>Download</p>
              <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>Track status and download when ready</p>
            </div>
          </div>
        </section>

        {/* Supported formats */}
        <section>
          <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--foreground)" }}>
            Supported conversions
          </h2>
          <div className="space-y-3">
            {CONVERSIONS.map((c) => (
              <div key={c.to} className="card flex items-center justify-between p-4">
                <div>
                  <p className="font-medium" style={{ color: "var(--foreground)" }}>
                    {c.from} → {c.to}
                  </p>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>{c.desc}</p>
                </div>
                <span className="badge bg-emerald-100 text-emerald-700">{c.to}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Limits */}
        <section className="rounded-[var(--radius-lg)] border p-6" style={{ borderColor: "var(--border)", background: "var(--muted-bg)" }}>
          <h2 className="mb-3 text-lg font-semibold" style={{ color: "var(--foreground)" }}>
            Limits & security
          </h2>
          <ul className="space-y-2 text-sm" style={{ color: "var(--muted)" }}>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Max 25MB per file
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Files expire after 24 hours
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Secure processing, no storage of sensitive data
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link href="/" className="btn-primary">
          Convert a file
        </Link>
        <Link href="/dashboard" className="btn-secondary">
          Dashboard
        </Link>
      </div>
    </main>
  );
}
