"use client";

// src/components/data-export-import.tsx
//
// Visible Export / Import JSON controls per FINAL_GOAL.md §2. One JSON blob
// round-trips every research-desk:v1:* key through the pure serializer in
// src/lib/storage.ts. Import is gated behind an inline confirmation panel
// so a misclick can't wipe 12 months of study — the user must re-click
// "Overwrite my data" after previewing which slots the uploaded file will
// write, and unknown-version / malformed payloads surface an explicit error
// instead of crashing or silently doing nothing.

import { useCallback, useRef, useState } from "react";

import {
  applyImportBundle,
  buildExportBundle,
  EXPORT_SLOT_NAMES,
  parseImportBundle,
  serializeExportBundle,
  summarizeBundle,
  type ExportBundle,
  type ExportSlotName,
  type ImportError,
} from "@/lib/storage";

/** Human labels for each slot, used in the confirmation summary. */
const SLOT_LABEL: Record<ExportSlotName, string> = {
  progress: "Curriculum progress",
  cards: "Flashcard scheduler",
  paperAnswers: "Paper answers",
  notes: "Notebook",
  streak: "Legacy (streak)",
  itemNotes: "Per-item notes",
};

type Status =
  | { kind: "idle" }
  | { kind: "just-exported"; filename: string }
  | { kind: "error"; message: string }
  | {
      kind: "confirm";
      bundle: ExportBundle;
      filename: string;
      present: ExportSlotName[];
      empty: ExportSlotName[];
    }
  | { kind: "imported"; written: ExportSlotName[] };

function describeError(reason: ImportError, detail?: string): string {
  switch (reason) {
    case "invalid-json":
      return "This file isn't valid JSON. Try re-exporting from the app that produced it.";
    case "not-a-bundle":
      return "This file doesn't look like a Research Desk export (expected a JSON object).";
    case "wrong-schema":
      return `This file isn't a Research Desk export${detail ? ` (saw schema "${detail}")` : ""}.`;
    case "unknown-version":
      return `This export is from a different schema version${detail ? ` (v${detail})` : ""}. Upgrade the app, or export a fresh bundle, and try again.`;
    case "bad-data-shape":
      return `The export is missing a required slot${detail ? `: ${detail}` : ""}.`;
  }
}

function filenameFor(bundle: ExportBundle): string {
  // `YYYY-MM-DD` prefix so users end up with a sortable archive directory.
  const iso = bundle.exportedAt.slice(0, 10);
  return `research-desk-${iso}.json`;
}

/**
 * Trigger a browser download for a string payload. Uses a blob + temporary
 * anchor click — no iframe, no navigation. SSR-safe: the component is
 * `"use client"` so this runs only after mount.
 */
function downloadString(filename: string, payload: string, mime: string): void {
  const blob = new Blob([payload], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke asynchronously so the browser has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface DataExportImportProps {
  /** Called after a successful import so parent hooks can re-hydrate. */
  onImported?: () => void;
}

export function DataExportImport({ onImported }: DataExportImportProps) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = useCallback(() => {
    const bundle = buildExportBundle();
    const filename = filenameFor(bundle);
    const payload = serializeExportBundle(bundle);
    downloadString(filename, payload, "application/json");
    setStatus({ kind: "just-exported", filename });
  }, []);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onerror = () => {
      setStatus({
        kind: "error",
        message: "Couldn't read the file. Check it isn't empty or locked.",
      });
    };
    reader.onload = () => {
      const raw = typeof reader.result === "string" ? reader.result : "";
      const parsed = parseImportBundle(raw);
      if (!parsed.ok) {
        setStatus({
          kind: "error",
          message: describeError(parsed.reason, parsed.detail),
        });
        return;
      }
      const { present, empty } = summarizeBundle(parsed.bundle);
      setStatus({
        kind: "confirm",
        bundle: parsed.bundle,
        filename: file.name,
        present,
        empty,
      });
    };
    reader.readAsText(file);
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset so selecting the SAME file twice still fires `change`.
      e.target.value = "";
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleConfirm = useCallback(() => {
    if (status.kind !== "confirm") return;
    const { written } = applyImportBundle(status.bundle);
    setStatus({ kind: "imported", written });
    onImported?.();
    // The imported envelopes are already in localStorage. A reload is the
    // cleanest way to let every hook rehydrate from its single source of
    // truth — matches what a power user expects from "Import my data".
    if (typeof window !== "undefined") {
      window.setTimeout(() => {
        window.location.reload();
      }, 400);
    }
  }, [status, onImported]);

  const handleCancel = useCallback(() => {
    setStatus({ kind: "idle" });
  }, []);

  return (
    <article
      data-testid="data-export-import"
      aria-label="Export and import your data"
      className="rounded-sm border border-solar-200 bg-solar-100/70 p-6 shadow-card"
    >
      <div className="flex items-baseline justify-between">
        <p className="mono text-[10px] uppercase tracking-[0.28em] text-coral-500">
          Your data
        </p>
        <span className="mono text-[10px] uppercase tracking-[0.22em] text-solar-500">
          localStorage · v1
        </span>
      </div>
      <h2 className="mt-3 font-serif text-2xl leading-tight text-solar-800">
        Export or import everything.
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-solar-600">
        A single JSON file contains every bit of state this app owns —
        curriculum progress, flashcard scheduler, paper answers, notebook,
        per-item notes. Back it up before wiping a browser profile or import
        it into a new one to pick up where you left off.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleExport}
          data-testid="export-button"
          className="mono inline-flex items-center gap-2 rounded-sm border border-coral-500 bg-coral-500 px-4 py-2 text-[12px] uppercase tracking-[0.22em] text-solar-50 transition-colors hover:bg-coral-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-600"
        >
          Export data
          <span aria-hidden>↓</span>
        </button>
        <button
          type="button"
          onClick={openFilePicker}
          data-testid="import-button"
          className="mono inline-flex items-center gap-2 rounded-sm border border-solar-300 bg-solar-50 px-4 py-2 text-[12px] uppercase tracking-[0.22em] text-solar-700 transition-colors hover:border-coral-500 hover:text-coral-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-600"
        >
          Import data
          <span aria-hidden>↑</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          data-testid="import-file-input"
          onChange={handleFileInputChange}
          className="sr-only"
          aria-label="Upload a Research Desk JSON export"
        />
      </div>

      {/* Status line — small, quiet, never shoves the rest of the page. */}
      <div
        aria-live="polite"
        data-testid="data-export-status"
        className="mt-4 min-h-[1.5rem] text-[12px] leading-relaxed"
      >
        {status.kind === "just-exported" && (
          <p className="text-solar-600">
            Downloaded{" "}
            <span className="mono text-solar-800">{status.filename}</span>.
          </p>
        )}
        {status.kind === "imported" && (
          <p data-testid="data-export-imported" className="text-sol-green">
            Imported {status.written.length} of {EXPORT_SLOT_NAMES.length} slots.
            Reloading…
          </p>
        )}
        {status.kind === "error" && (
          <p data-testid="data-export-error" className="text-sol-red">
            <span className="mono uppercase tracking-[0.18em]">Import failed</span>{" "}
            — {status.message}
          </p>
        )}
        {status.kind === "idle" && (
          <p className="text-solar-500">
            Nothing leaves this browser unless you click Export.
          </p>
        )}
      </div>

      {/* Import confirmation — inline so focus doesn't jump to a modal. */}
      {status.kind === "confirm" && (
        <div
          role="dialog"
          aria-label="Confirm import"
          data-testid="import-confirm"
          className="mt-5 rounded-sm border border-coral-500/60 bg-solar-50 p-5"
        >
          <p className="mono text-[10px] uppercase tracking-[0.28em] text-coral-500">
            Confirm import
          </p>
          <h3 className="mt-2 font-serif text-xl leading-tight text-solar-800">
            This will overwrite your current data.
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-solar-600">
            Reading{" "}
            <span className="mono text-solar-800">{status.filename}</span>{" "}
            (exported{" "}
            <span className="mono text-solar-700">
              {status.bundle.exportedAt.slice(0, 10)}
            </span>
            ). {status.present.length} of {EXPORT_SLOT_NAMES.length} slots will
            be written. Empty slots in the file are left untouched.
          </p>
          <ul
            data-testid="import-slot-summary"
            className="mt-3 grid gap-1.5 sm:grid-cols-2"
          >
            {EXPORT_SLOT_NAMES.map((slot) => {
              const hasData = status.present.includes(slot);
              return (
                <li
                  key={slot}
                  data-testid={`import-slot-${slot}`}
                  data-has-data={hasData ? "true" : "false"}
                  className="flex items-center gap-2 text-[12px]"
                >
                  <span
                    aria-hidden
                    className={
                      "inline-block h-2 w-2 rounded-full " +
                      (hasData ? "bg-coral-500" : "bg-solar-300")
                    }
                  />
                  <span
                    className={
                      hasData ? "text-solar-700" : "text-solar-500 line-through"
                    }
                  >
                    {SLOT_LABEL[slot]}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 flex items-center gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              data-testid="import-confirm-button"
              className="mono inline-flex items-center gap-2 rounded-sm border border-coral-500 bg-coral-500 px-4 py-2 text-[12px] uppercase tracking-[0.22em] text-solar-50 transition-colors hover:bg-coral-600"
            >
              Overwrite my data
            </button>
            <button
              type="button"
              onClick={handleCancel}
              data-testid="import-cancel-button"
              className="mono inline-flex items-center gap-2 rounded-sm border border-solar-300 bg-transparent px-4 py-2 text-[12px] uppercase tracking-[0.22em] text-solar-700 transition-colors hover:border-solar-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
