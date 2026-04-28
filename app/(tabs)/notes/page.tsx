import { TabStub } from "../_components/tab-stub";

export default function NotesPage() {
  return (
    <TabStub
      label="Notes"
      title="A markdown notebook, autosaved."
      description="Free-form, multi-page, keyboard-first. The place where the curriculum and flashcards deposit what you actually learned."
      bullets={[
        "≥ 3 named pages with autosave — no save button to remember.",
        "Side-by-side markdown preview on desktop; tabbed on mobile.",
        "State in research-desk:v1:notes; export / import via the persistence JSON.",
        "Fraunces serif for headings, Geist Mono for code — matches the rest of the desk.",
      ]}
    />
  );
}
