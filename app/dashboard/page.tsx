import { redirect } from "next/navigation";

/**
 * Legacy `/dashboard` URL kept alive as a permanent redirect to `/curriculum`.
 * FINAL_GOAL.md §5 removed the Dashboard tab entirely; any bookmarked link,
 * old tab state, or earlier export-import reload target still lands safely
 * on the real home page.
 */
export default function DashboardRedirect(): never {
  redirect("/curriculum");
}
