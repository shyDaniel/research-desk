import { NotesEditor } from "@/components/notes-editor";

/**
 * /notes — the markdown notebook. FINAL_GOAL.md §3.5 requires ≥ 3 named
 * pages, autosave to research-desk:v1:notes, side-by-side markdown preview
 * on desktop and a tabbed edit/preview switcher on mobile. The full surface
 * lives in `NotesEditor`; this route is a thin wrapper so the route stays
 * prerenderable while the editor pulls "use client".
 */
export default function NotesPage() {
  return <NotesEditor />;
}
