import { TabStub } from "../_components/tab-stub";

export default function FlashcardsPage() {
  return (
    <TabStub
      label="Flashcards"
      title="SM-2, kept honest."
      description="A spaced-repetition deck tuned for load-bearing RLHF and MLE-fundamentals concepts. ≥ 30 cards, each with a paragraph-length answer a senior researcher would not wince at."
      bullets={[
        "SM-2 scheduler: Again / Hard / Good / Easy with ease factor, interval, reps.",
        "Today's due queue first; explicit empty-state when drained.",
        "Keyboard shortcuts: Space = flip, 1/2/3/4 = grade.",
        "Per-card stats drawer: ease factor, interval, reps.",
      ]}
    />
  );
}
