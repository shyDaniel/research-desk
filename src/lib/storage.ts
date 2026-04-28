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

/**
 * Read + write the full export envelope across all known v1 keys. Used by
 * the Export / Import JSON flow.
 */
export function exportAll(): Record<string, unknown> {
  const out: Record<string, unknown> = { version: CURRENT_VERSION };
  for (const [name, key] of Object.entries(STORAGE_KEYS)) {
    out[name] = readEnvelope(key, null);
  }
  return out;
}
