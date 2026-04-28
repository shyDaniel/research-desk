import Link from "next/link";

/**
 * Honest placeholder for tabs whose full UI hasn't landed yet. Appears inside
 * the (tabs) layout so the sidebar is still visible and the user never bounces
 * to a 404. When the real tab ships, the route's page.tsx replaces this stub.
 */
export function TabStub({
  label,
  title,
  description,
  bullets,
}: {
  label: string;
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="border-b border-solar-200 pb-6">
        <p className="mono text-[11px] uppercase tracking-[0.28em] text-coral-500">
          {label}
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-solar-800 sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-solar-600">
          {description}
        </p>
      </header>

      <section className="mt-10 rounded-sm border border-solar-200 bg-solar-100 p-6 shadow-card">
        <p className="mono text-[10px] uppercase tracking-[0.28em] text-solar-600">
          Shipping next
        </p>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-solar-700">
          {bullets.map((b) => (
            <li key={b} className="flex gap-3">
              <span
                aria-hidden
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-coral-500"
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-solar-200 pt-5">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-sm border border-solar-300 bg-solar-50 px-4 py-2 text-sm text-solar-700 hover:border-coral-500 hover:text-coral-600"
          >
            <span aria-hidden className="mono text-[10px] tracking-widest">
              ←
            </span>
            Back to dashboard
          </Link>
          <span className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
            build progresses tab by tab
          </span>
        </div>
      </section>
    </div>
  );
}
