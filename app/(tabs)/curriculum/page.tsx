import { TabStub } from "../_components/tab-stub";

export default function CurriculumPage() {
  return (
    <TabStub
      label="Curriculum"
      title="55 items, five phases, one path."
      description="The curriculum data is authored and link-verified; this tab renders it next iteration. Every item carries a mentor-voice focus note, a real URL, and a place to take per-item notes."
      bullets={[
        "Phase grouping with collapsible sections (Foundations → Capstone).",
        "Filters: by phase, by track (RLHF / MLE-Fundamentals), by type, by completion state.",
        "Per-item checkboxes with pending → in-progress → done transitions, persisted in research-desk:v1:progress.",
        "Side-sheet detail view with the focus note, canonical URL, and a free-text notes textarea.",
      ]}
    />
  );
}
