"use client";

// src/components/notes-editor.tsx
//
// The full /notes surface. Desktop (≥1024px, lg breakpoint):
//
//   ┌────────────────────────────────────────────────────────────────────┐
//   │ [Notes] [Scratch] [Weekly log]       …header / status / autosave… │
//   ├──────────────────────┬─────────────────────────────────────────────┤
//   │ <textarea>           │ rendered markdown preview                   │
//   │  (Geist Mono)        │  (Fraunces headings, Geist body)            │
//   │                      │                                             │
//   └──────────────────────┴─────────────────────────────────────────────┘
//
// Mobile (<1024px): the page-tab row is the same; below it, a second row of
// two pill buttons — "Write" / "Preview" — switches the single main column
// between the textarea and the rendered preview (same textarea ref so state
// survives the toggle).

import { useEffect, useMemo, useState } from "react";

import { renderMarkdown } from "@/lib/markdown";
import type { NotePage } from "@/lib/notes";
import { useNotes } from "@/state/use-notes";

type MobilePane = "write" | "preview";

export function NotesEditor() {
  const { pages, hydrated, setBody } = useNotes();
  const [activeId, setActiveId] = useState<string>(() => pages[0]?.id ?? "notes");
  const [mobilePane, setMobilePane] = useState<MobilePane>("write");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // If the persisted page list ever dropped or renamed the active page,
  // snap back to the first available page so we never render an empty tab.
  useEffect(() => {
    if (pages.length === 0) return;
    const first = pages[0];
    if (first && !pages.some((p) => p.id === activeId)) {
      setActiveId(first.id);
    }
  }, [pages, activeId]);

  const activePage: NotePage | undefined = useMemo(
    () => pages.find((p) => p.id === activeId) ?? pages[0],
    [pages, activeId]
  );

  // Bump a "saved at" ticker on each edit so the header can render an
  // understated "autosaved" timestamp — the user should trust the edit made it
  // to disk without having to tap a save button.
  const handleChange = (value: string) => {
    if (!activePage) return;
    setBody(activePage.id, value);
    setSavedAt(Date.now());
  };

  const preview = useMemo(
    () => (activePage ? renderMarkdown(activePage.body) : null),
    [activePage]
  );

  return (
    <div className="mx-auto max-w-6xl" data-testid="notes-editor">
      <header className="border-b border-solar-200 pb-6">
        <p className="mono text-[11px] uppercase tracking-[0.28em] text-coral-500">
          Notes
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-solar-800 sm:text-5xl">
          The notebook.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-solar-600">
          Free-form markdown across three named pages. Autosaves as you type — no
          save button. Lives entirely in your browser under{" "}
          <code>research-desk:v1:notes</code>.
        </p>
      </header>

      {/* Page tab bar — same on desktop and mobile. */}
      <nav
        aria-label="Note pages"
        role="tablist"
        data-testid="page-tablist"
        className="mt-6 flex flex-wrap items-center gap-2 border-b border-solar-200 pb-3"
      >
        {pages.map((page) => {
          const isActive = page.id === activeId;
          return (
            <button
              key={page.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`note-panel-${page.id}`}
              id={`note-tab-${page.id}`}
              data-testid={`page-tab-${page.id}`}
              data-active={isActive ? "true" : "false"}
              onClick={() => setActiveId(page.id)}
              className={
                "mono inline-flex items-center gap-2 rounded-sm px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] transition-colors " +
                (isActive
                  ? "border border-coral-500 bg-coral-50 text-coral-700"
                  : "border border-solar-200 bg-solar-50 text-solar-600 hover:border-coral-300 hover:text-coral-600")
              }
            >
              <span
                aria-hidden
                className={
                  "h-1.5 w-1.5 rounded-full " +
                  (isActive ? "bg-coral-500" : "bg-solar-300")
                }
              />
              {page.title}
            </button>
          );
        })}
        <span
          className="mono ml-auto text-[10px] uppercase tracking-[0.22em] text-solar-500"
          data-testid="autosave-indicator"
          aria-live="polite"
        >
          {!hydrated
            ? "loading…"
            : savedAt
              ? "autosaved"
              : "autosave on"}
        </span>
      </nav>

      {/* Mobile pane switcher — hidden ≥ lg (desktop split-view takes over). */}
      <div
        className="mt-4 flex gap-2 lg:hidden"
        role="tablist"
        aria-label="Edit or preview"
      >
        {(["write", "preview"] as const).map((pane) => {
          const isActive = mobilePane === pane;
          return (
            <button
              key={pane}
              type="button"
              role="tab"
              aria-selected={isActive}
              data-testid={`mobile-pane-${pane}`}
              onClick={() => setMobilePane(pane)}
              className={
                "mono inline-flex items-center rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] " +
                (isActive
                  ? "bg-solar-800 text-solar-50"
                  : "border border-solar-200 bg-solar-50 text-solar-600")
              }
            >
              {pane === "write" ? "Write" : "Preview"}
            </button>
          );
        })}
      </div>

      {/* Editor + preview. Desktop: side-by-side grid. Mobile: single column
           with the pane switcher above selecting which is rendered. */}
      <div
        data-testid="notes-workspace"
        className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6"
      >
        {/* Write pane */}
        <section
          id={activePage ? `note-panel-${activePage.id}` : undefined}
          role="tabpanel"
          aria-labelledby={activePage ? `note-tab-${activePage.id}` : undefined}
          data-testid="write-pane"
          data-mobile-visible={mobilePane === "write" ? "true" : "false"}
          className={
            "rounded-sm border border-solar-200 bg-solar-50 shadow-inset-hairline " +
            (mobilePane === "write" ? "" : "hidden ") +
            "lg:block"
          }
        >
          <div className="flex items-center justify-between border-b border-solar-200 px-4 py-2">
            <span className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
              Edit · {activePage?.title ?? ""}
            </span>
            <span className="mono text-[10px] uppercase tracking-[0.22em] text-solar-400">
              Markdown
            </span>
          </div>
          <textarea
            key={activePage?.id ?? "none"}
            data-testid="notes-textarea"
            data-page-id={activePage?.id}
            aria-label={`Edit page: ${activePage?.title ?? ""}`}
            value={activePage?.body ?? ""}
            onChange={(e) => handleChange(e.target.value)}
            spellCheck
            className="mono block min-h-[60vh] w-full resize-y border-0 bg-solar-50 px-4 py-4 text-[14px] leading-[1.7] text-solar-800 placeholder:text-solar-400 focus:outline-none"
            placeholder="Start typing. Use # for a heading, **bold**, *italic*, `code`, - for a list."
          />
        </section>

        {/* Preview pane */}
        <section
          aria-label={`Preview of page: ${activePage?.title ?? ""}`}
          data-testid="preview-pane"
          data-mobile-visible={mobilePane === "preview" ? "true" : "false"}
          className={
            "rounded-sm border border-solar-200 bg-solar-100/60 " +
            (mobilePane === "preview" ? "" : "hidden ") +
            "lg:block"
          }
        >
          <div className="flex items-center justify-between border-b border-solar-200 px-4 py-2">
            <span className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
              Preview
            </span>
            <span className="mono text-[10px] uppercase tracking-[0.22em] text-solar-400">
              Rendered
            </span>
          </div>
          <div
            className="min-h-[60vh] px-5 py-5 text-[15px] leading-[1.7] text-solar-700"
            data-testid="preview-body"
          >
            {preview}
          </div>
        </section>
      </div>

      <p className="mono mt-6 text-[10px] uppercase tracking-[0.22em] text-solar-500">
        Keyboard · Tab to indent while writing · Autosave every 250 ms
      </p>
    </div>
  );
}
