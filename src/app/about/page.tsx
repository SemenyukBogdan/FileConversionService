import Link from "next/link";

const CONVERTERS = [
  { name: "LibreOffice", formats: "Word, ODT, RTF, HTML, PDF, AbiWord, Lotus, WordPerfect, Works", desc: "Офісні документи" },
  { name: "Pandoc", formats: "Markdown, reST, LaTeX, PDF, DOCX, ODT, RTF, HTML, TXT", desc: "Розмітка та текст" },
  { name: "DjVuLibre", formats: "DjVu ↔ PDF", desc: "DjVu зображення" },
];

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-12">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl" style={{ color: "var(--foreground)" }}>
          Про конвертацію файлів
        </h1>
        <p className="mt-3 text-lg" style={{ color: "var(--muted)" }}>
          Конвертація документів між 19 форматами. Швидко, безкоштовно, без реєстрації.
        </p>
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--foreground)" }}>
            Як це працює
          </h2>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold" style={{ background: "var(--primary)", color: "white" }}>
              1
            </div>
            <div>
              <p className="font-medium" style={{ color: "var(--foreground)" }}>Завантажте файл</p>
              <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>Оберіть документ і цільовий формат</p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold" style={{ background: "var(--muted-bg)", color: "var(--muted)" }}>
              2
            </div>
            <div>
              <p className="font-medium" style={{ color: "var(--foreground)" }}>Конвертація</p>
              <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>Обробка в фоні асинхронно</p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold" style={{ background: "var(--muted-bg)", color: "var(--muted)" }}>
              3
            </div>
            <div>
              <p className="font-medium" style={{ color: "var(--foreground)" }}>Завантаження</p>
              <p className="mt-0.5 text-sm" style={{ color: "var(--muted)" }}>Слідкуйте за статусом і завантажте результат</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--foreground)" }}>
            Конвертери
          </h2>
          <div className="space-y-3">
            {CONVERTERS.map((c) => (
              <div key={c.name} className="card p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium" style={{ color: "var(--foreground)" }}>{c.name}</p>
                  <span className="badge bg-emerald-100 text-emerald-700">{c.desc}</span>
                </div>
                <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>{c.formats}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border p-6" style={{ borderColor: "var(--border)", background: "var(--muted-bg)" }}>
          <h2 className="mb-3 text-lg font-semibold" style={{ color: "var(--foreground)" }}>
            Обмеження та безпека
          </h2>
          <ul className="space-y-2 text-sm" style={{ color: "var(--muted)" }}>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Максимум 25 МБ на файл
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Файли видаляються через 24 години
            </li>
            <li className="flex items-center gap-2">
              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Безпечна обробка, без збереження чутливих даних
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link href="/" className="btn-primary">
          Конвертувати файл
        </Link>
        <Link href="/dashboard" className="btn-secondary">
          Панель керування
        </Link>
      </div>
    </main>
  );
}
