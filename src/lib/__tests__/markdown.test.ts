import { describe, it, expect } from "vitest";

import { parseBlocks, parseInline } from "@/lib/markdown";

describe("markdown block parser", () => {
  it("parses an ATX heading", () => {
    const [b] = parseBlocks("# Hello");
    expect(b).toEqual({ kind: "heading", level: 1, text: "Hello" });
  });

  it("parses heading levels h1..h6", () => {
    const blocks = parseBlocks("# a\n## b\n### c\n#### d\n##### e\n###### f");
    const levels = blocks
      .filter((b) => b.kind === "heading")
      .map((b) => (b as { level: number }).level);
    expect(levels).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("parses a fenced code block with language tag", () => {
    const blocks = parseBlocks("```python\nprint(1)\nprint(2)\n```");
    expect(blocks[0]).toEqual({
      kind: "code",
      lang: "python",
      body: "print(1)\nprint(2)",
    });
  });

  it("parses an unordered list", () => {
    const [b] = parseBlocks("- one\n- two\n- three");
    expect(b).toEqual({ kind: "ul", items: ["one", "two", "three"] });
  });

  it("parses an ordered list", () => {
    const [b] = parseBlocks("1. a\n2. b");
    expect(b).toEqual({ kind: "ol", items: ["a", "b"] });
  });

  it("parses a paragraph that spans multiple lines", () => {
    const blocks = parseBlocks("line one\nline two");
    expect(blocks[0]).toEqual({ kind: "paragraph", text: "line one line two" });
  });

  it("separates paragraphs on blank lines", () => {
    const blocks = parseBlocks("first\n\nsecond");
    const paras = blocks.filter((b) => b.kind === "paragraph") as {
      text: string;
    }[];
    expect(paras.map((p) => p.text)).toEqual(["first", "second"]);
  });

  it("parses a blockquote with multiple lines", () => {
    const blocks = parseBlocks("> one\n> two");
    expect(blocks[0]).toEqual({ kind: "blockquote", lines: ["one", "two"] });
  });
});

describe("markdown inline parser", () => {
  it("handles plain text", () => {
    expect(parseInline("hello world")).toEqual([
      { kind: "text", value: "hello world" },
    ]);
  });

  it("handles **bold**", () => {
    const nodes = parseInline("say **hello** now");
    expect(nodes).toHaveLength(3);
    expect(nodes[0]).toEqual({ kind: "text", value: "say " });
    expect(nodes[1]!.kind).toBe("bold");
    expect(nodes[2]).toEqual({ kind: "text", value: " now" });
  });

  it("handles *italic*", () => {
    const nodes = parseInline("a *b* c");
    expect(nodes[1]!.kind).toBe("italic");
  });

  it("handles `inline code`", () => {
    const nodes = parseInline("run `pnpm test`");
    expect(nodes[1]).toEqual({ kind: "code", value: "pnpm test" });
  });

  it("handles [text](https://url) and rejects non-http(s) schemes", () => {
    const ok = parseInline("[arxiv](https://arxiv.org/abs/1707.06347)");
    expect(ok[0]!.kind).toBe("link");
    expect((ok[0] as { href: string }).href).toBe(
      "https://arxiv.org/abs/1707.06347"
    );

    // javascript: must NOT be promoted to a link node — falls back to text.
    const bad = parseInline("[x](javascript:alert(1))");
    expect(bad.every((n) => n.kind !== "link")).toBe(true);
  });

  it("does not promote '* with spaces *' into italics", () => {
    const nodes = parseInline("a * b * c");
    expect(nodes.every((n) => n.kind !== "italic")).toBe(true);
  });

  it("handles **bold** containing `code`", () => {
    const nodes = parseInline("**run `x`**");
    expect(nodes[0]!.kind).toBe("bold");
    const inner = (nodes[0] as { children: { kind: string }[] }).children;
    expect(inner.some((c) => c.kind === "code")).toBe(true);
  });
});
