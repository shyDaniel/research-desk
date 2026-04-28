import { redirect } from "next/navigation";

/**
 * Root redirect. FINAL_GOAL.md §5 mandate: "The curriculum page IS the
 * home page." There is no separate marketing landing — visiting `/`
 * takes the user straight into the content.
 */
export default function HomePage(): never {
  redirect("/curriculum");
}
