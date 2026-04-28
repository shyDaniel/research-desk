// src/lib/storage.ts
//
// Versioned localStorage wrapper per FINAL_GOAL.md §2 and ARCHITECTURE.md.
// All user state lives under the `research-desk:v1:*` namespace wrapped in
// a `{ version, data }` envelope. The wrapper never throws: missing keys
// read as `null`, unreadable / future payloads fall back to a caller-
// supplied default, and a migration hook runs for older known versions.
//
// This module is pure logic, SSR-safe, and usable in tests — it guards
// every access to `window.localStorage` so importing it during a Node
// render is a no-op.

export const STORAGE_NAMESPACE = "research-desk";

/** Current schema version for every key this module owns. */
export const CURRENT_VERSION = 1 as const;

/** Known v1 keys. Adding a new one means also picking a namespaced suffix. */
export const STORAGE_KEYS = {
  progress: `${STORAGE_NAMESPACE}:v${CURRENT_VERSION}:progress`,
  cards: `${STORAGE_NAMESPACE}:v${CURRENT_VERSION}:cards`,
  paperAnswers: `${STORAGE_NAMESPACE}:v${CURRENT_VERSION}:paper-answers`,
  notes: `${STORAGE_NAMESPACE}:v${CURRENT_VERSION}:notes`,
  streak: `${STORAGE_NAMESPACE}:v${CURRENT_VERSION}:streak`,
  itemNotes: `${STORAGE_NAMESPACE}:v${CURRENT_VERSION}:item-notes`,
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** Envelope wrapping the actual payload so we can migrate schemas cleanly. */
export interface Envelope<T> {
  version: number;
  data: T;
}

/**
 * Optional migration map — keyed by the SOURCE version. Each entry upgrades
 * from `fromVersion` to `fromVersion + 1`. The wrapper composes them.
 * Today we're on v1 with no predecessors; this is here so future iterations
 * can drop in a migration without touching every call site.
 */
export type Migrator = (data: unknown) => unknown;
export type MigrationMap = Record<number, Migrator>;

const DEFAULT_MIGRATIONS: MigrationMap = {};

function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Read a versioned envelope from localStorage.
 *
 * Behavior contract:
 *   - Returns `fallback` when the key is missing.
 *   - Returns `fallback` if JSON.parse throws (unreadable payload).
 *   - Returns `fallback` if the envelope shape is wrong.
 *   - Returns `fallback` if the payload is from a FUTURE version we don't
 *     know how to read (graceful forward-incompat).
 *   - Runs registered migrations for older versions and returns the result.
 *   - Returns `data` verbatim when `version === CURRENT_VERSION`.
 *
 * This function NEVER throws. Callers can trust the return value.
 */
export function readEnvelope<T>(
  key: string,
  fallback: T,
  migrations: MigrationMap = DEFAULT_MIGRATIONS
): T {
  if (!hasWindow()) return fallback;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    return fallback;
  }
  if (raw === null) return fallback;
  return parseEnvelope<T>(raw, fallback, migrations);
}

/**
 * Pure-function variant that operates on a raw string. Exposed primarily
 * so tests don't have to touch `window.localStorage`.
 */
export function parseEnvelope<T>(
  raw: string,
  fallback: T,
  migrations: MigrationMap = DEFAULT_MIGRATIONS
): T {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return fallback;
  }
  if (!isEnvelopeShape(parsed)) return fallback;

  let { version, data } = parsed;
  if (version === CURRENT_VERSION) return data as T;
  if (version > CURRENT_VERSION) return fallback;

  // Older version: run migrations forward, stopping if any step is missing.
  while (version < CURRENT_VERSION) {
    const step = migrations[version];
    if (!step) return fallback;
    try {
      data = step(data);
    } catch {
      return fallback;
    }
    version += 1;
  }
  return data as T;
}

function isEnvelopeShape(x: unknown): x is Envelope<unknown> {
  return (
    typeof x === "object" &&
    x !== null &&
    "version" in x &&
    "data" in x &&
    typeof (x as { version: unknown }).version === "number"
  );
}

/**
 * Write a value under the current envelope version. Swallows quota / security
 * errors so the caller never has to wrap every setState in a try-catch — the
 * worst outcome on failure is that state doesn't persist across reloads.
 */
export function writeEnvelope<T>(key: string, data: T): void {
  if (!hasWindow()) return;
  const envelope: Envelope<T> = { version: CURRENT_VERSION, data };
  try {
    window.localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // Quota exceeded, private mode, etc. — silently give up.
  }
}

/** Remove a key. No-op on server and on failure. */
export function clearKey(key: string): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/* ──────────────────────────────────────────────────────────────────────
 * Export / Import — single JSON bundle containing every research-desk:v1:*
 * key. Drives the visible "Export data" / "Import data" buttons on the
 * Dashboard (FINAL_GOAL.md §2 hard acceptance).
 * ────────────────────────────────────────────────────────────────────── */

/** Stable schema identifier so a future format migration can be detected. */
export const EXPORT_SCHEMA = "research-desk" as const;

/**
 * Shape of the single JSON file a user downloads from "Export data" and
 * re-uploads through "Import data". `schema` + `version` together form a
 * version guard: `parseImportBundle` refuses anything that doesn't match.
 */
export interface ExportBundle {
  schema: typeof EXPORT_SCHEMA;
  version: number;
  /** ISO timestamp of when the bundle was produced. Informational only. */
  exportedAt: string;
  /** Per-key payloads, keyed by the same names used in STORAGE_KEYS. */
  data: ExportBundleData;
}

/**
 * One slot per known key. `null` means the user had no persisted value for
 * that slot at export time — we preserve the distinction so Import can skip
 * writing null slots (leaving existing storage untouched for them).
 */
export interface ExportBundleData {
  progress: unknown;
  cards: unknown;
  paperAnswers: unknown;
  notes: unknown;
  streak: unknown;
  itemNotes: unknown;
}

/** Slot name ↔ STORAGE_KEYS field. */
export const EXPORT_SLOT_NAMES = [
  "progress",
  "cards",
  "paperAnswers",
  "notes",
  "streak",
  "itemNotes",
] as const satisfies readonly (keyof typeof STORAGE_KEYS)[];

export type ExportSlotName = (typeof EXPORT_SLOT_NAMES)[number];

/**
 * Build an export bundle by reading each v1 key from the given `readers`.
 * Injected rather than going straight through `readEnvelope` so unit tests
 * can exercise the serializer without touching `window.localStorage`.
 */
export function buildExportBundle(
  readers: Record<ExportSlotName, () => unknown> = defaultReaders(),
  now: Date = new Date(),
): ExportBundle {
  const data: ExportBundleData = {
    progress: readers.progress(),
    cards: readers.cards(),
    paperAnswers: readers.paperAnswers(),
    notes: readers.notes(),
    streak: readers.streak(),
    itemNotes: readers.itemNotes(),
  };
  return {
    schema: EXPORT_SCHEMA,
    version: CURRENT_VERSION,
    exportedAt: now.toISOString(),
    data,
  };
}

/**
 * Serialize to the exact string the user downloads. Two-space indent so the
 * file is human-editable in a text editor — that's part of the "export to a
 * JSON blob, edit or archive it, then import" workflow in the brief.
 */
export function serializeExportBundle(bundle: ExportBundle): string {
  return JSON.stringify(bundle, null, 2);
}

/** Result of `parseImportBundle`. Discriminated so callers can show a
 *  precise error message without re-parsing the failure. */
export type ImportParseResult =
  | { ok: true; bundle: ExportBundle }
  | { ok: false; reason: ImportError; detail?: string };

export type ImportError =
  | "invalid-json"
  | "not-a-bundle"
  | "wrong-schema"
  | "unknown-version"
  | "bad-data-shape";

/**
 * Parse a raw uploaded string into a validated `ExportBundle`, or return a
 * structured failure. NEVER throws. The schema + version guard here is the
 * "refuses unknown versions gracefully" requirement from the subtask brief.
 */
export function parseImportBundle(raw: string): ImportParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "invalid-json" };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, reason: "not-a-bundle" };
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.schema !== EXPORT_SCHEMA) {
    return {
      ok: false,
      reason: "wrong-schema",
      detail: typeof obj.schema === "string" ? obj.schema : String(obj.schema),
    };
  }
  if (typeof obj.version !== "number" || !Number.isFinite(obj.version)) {
    return { ok: false, reason: "unknown-version" };
  }
  if (obj.version !== CURRENT_VERSION) {
    return {
      ok: false,
      reason: "unknown-version",
      detail: String(obj.version),
    };
  }
  if (typeof obj.data !== "object" || obj.data === null) {
    return { ok: false, reason: "bad-data-shape" };
  }
  const data = obj.data as Record<string, unknown>;
  // Every slot must exist as a key (value may be null). This catches
  // truncated or partially-built bundles without blowing up on valid ones
  // that legitimately have null for an untouched slot.
  for (const slot of EXPORT_SLOT_NAMES) {
    if (!(slot in data)) {
      return { ok: false, reason: "bad-data-shape", detail: slot };
    }
  }
  const exportedAt =
    typeof obj.exportedAt === "string" ? obj.exportedAt : new Date(0).toISOString();
  return {
    ok: true,
    bundle: {
      schema: EXPORT_SCHEMA,
      version: obj.version,
      exportedAt,
      data: {
        progress: data.progress,
        cards: data.cards,
        paperAnswers: data.paperAnswers,
        notes: data.notes,
        streak: data.streak,
        itemNotes: data.itemNotes,
      },
    },
  };
}

/**
 * Count the non-null slots in a validated bundle. Used by the Import UI to
 * summarise what the user is about to overwrite ("4 of 6 slots present").
 */
export function summarizeBundle(bundle: ExportBundle): {
  present: ExportSlotName[];
  empty: ExportSlotName[];
} {
  const present: ExportSlotName[] = [];
  const empty: ExportSlotName[] = [];
  for (const slot of EXPORT_SLOT_NAMES) {
    const value = bundle.data[slot];
    if (value === null || value === undefined) {
      empty.push(slot);
    } else {
      present.push(slot);
    }
  }
  return { present, empty };
}

/**
 * Apply a validated bundle to storage via the given writers. Slots whose
 * value is `null`/`undefined` are skipped so users can ship a targeted
 * partial bundle (e.g. only notes) without wiping unrelated state.
 */
export function applyImportBundle(
  bundle: ExportBundle,
  writers: Record<ExportSlotName, (data: unknown) => void> = defaultWriters(),
): { written: ExportSlotName[]; skipped: ExportSlotName[] } {
  const written: ExportSlotName[] = [];
  const skipped: ExportSlotName[] = [];
  for (const slot of EXPORT_SLOT_NAMES) {
    const value = bundle.data[slot];
    if (value === null || value === undefined) {
      skipped.push(slot);
      continue;
    }
    writers[slot](value);
    written.push(slot);
  }
  return { written, skipped };
}

function defaultReaders(): Record<ExportSlotName, () => unknown> {
  const readers = {} as Record<ExportSlotName, () => unknown>;
  for (const slot of EXPORT_SLOT_NAMES) {
    const key = STORAGE_KEYS[slot];
    readers[slot] = () => readEnvelope<unknown>(key, null);
  }
  return readers;
}

function defaultWriters(): Record<ExportSlotName, (data: unknown) => void> {
  const writers = {} as Record<ExportSlotName, (data: unknown) => void>;
  for (const slot of EXPORT_SLOT_NAMES) {
    const key = STORAGE_KEYS[slot];
    writers[slot] = (data) => writeEnvelope(key, data);
  }
  return writers;
}
