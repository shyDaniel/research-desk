"use client";

// src/components/notes-editor.tsx
//
// The full /notes surface. FINAL_GOAL.md §3 Page 4 mandates a single
// persistent scratchpad — "No multiple named pages. No tabs." The layout is:
//
//   Desktop (≥1024px, lg breakpoint):
//   ┌───────────────────────────────────┬───────────────────────────────────┐
//   │ <textarea> (Geist Mono)           │ rendered markdown preview         │
//   │                                   │ (Fraunces headings, Geist body)   │
//   └───────────────────────────────────┴───────────────────────────────────┘
//
//   Mobile (<1024px): a single column + a Write / Preview pill switcher at
//   the top that toggles between the editor and the rendered preview. The
//   textarea state lives in the hook, not in the DOM element, so the toggle
//   preserves every keystroke.

import { useMemo, useState } from "react";

import { renderMarkdown } from "@/lib/markdown";
import { useNotes } from "@/state/use-notes";

type MobilePane = "write" | "preview";

export function NotesEditor() {
  const { body, hydrated, setBody } = useNotes();
  const [mobilePane, setMobilePane] = useState<MobilePane>("write");
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const handleChange = (value: string) => {
    setBody(value);
    setSavedAt(Date.now());
  };

  const preview = useMemo(() => renderMarkdown(body), [body]);

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
          One persistent markdown scratchpad. Autosaves as you type — no save
          button. Lives entirely in your browser under{" "}
          <code>research-desk:v1:notes</code>.
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span
            className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500"
            data-testid="autosave-indicator"
            aria-live="polite"
          >
            {!hydrated
              ? "loading…"
              : savedAt
                ? "autosaved"
                : "autosave on"}
          </span>
          <span className="mono text-[10px] uppercase tracking-[0.22em] text-solar-400">
            Markdown · Geist Mono
          </span>
        </div>
      </header>

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
              Edit
            </span>
            <span className="mono text-[10px] uppercase tracking-[0.22em] text-solar-400">
              Markdown
            </span>
          </div>
          <textarea
            data-testid="notes-textarea"
            aria-label="Notebook body"
            value={body}
            onChange={(e) => handleChange(e.target.value)}
            spellCheck
            className="mono block min-h-[60vh] w-full resize-y border-0 bg-solar-50 px-4 py-4 text-[14px] leading-[1.7] text-solar-800 placeholder:text-solar-400 focus:outline-none"
            placeholder="Start typing. Use # for a heading, **bold**, *italic*, `code`, - for a list."
          />
        </section>

        {/* Preview pane */}
        <section
          aria-label="Preview"
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
