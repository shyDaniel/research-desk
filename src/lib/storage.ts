// Versioned localStorage wrapper for the three remaining persistent slots:
// per-item progress, paper-question answers, and per-item notes. Every value
// is wrapped in `{ version, data }` under the `research-desk:v1:*` namespace.
// The wrapper is SSR-safe and never throws — missing or unreadable payloads
// fall back to a caller-supplied default.

export const STORAGE_NAMESPACE = "research-desk";

export const CURRENT_VERSION = 1 as const;

export const STORAGE_KEYS = {
  progress: `${STORAGE_NAMESPACE}:v${CURRENT_VERSION}:progress`,
  paperAnswers: `${STORAGE_NAMESPACE}:v${CURRENT_VERSION}:paper-answers`,
  itemNotes: `${STORAGE_NAMESPACE}:v${CURRENT_VERSION}:item-notes`,
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export interface Envelope<T> {
  version: number;
  data: T;
}

export type Migrator = (data: unknown) => unknown;
export type MigrationMap = Record<number, Migrator>;

const DEFAULT_MIGRATIONS: MigrationMap = {};

function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readEnvelope<T>(
  key: string,
  fallback: T,
  migrations: MigrationMap = DEFAULT_MIGRATIONS,
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

export function parseEnvelope<T>(
  raw: string,
  fallback: T,
  migrations: MigrationMap = DEFAULT_MIGRATIONS,
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

export function writeEnvelope<T>(key: string, data: T): void {
  if (!hasWindow()) return;
  const envelope: Envelope<T> = { version: CURRENT_VERSION, data };
  try {
    window.localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // Quota exceeded, private mode, etc. — silently give up.
  }
}

export function clearKey(key: string): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}
