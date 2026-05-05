// src/lib/markdown.tsx
//
// A small, safe, React-native markdown renderer used by curriculum focus
// notes and paper summaries.
//
// WHY NOT A LIBRARY: react-markdown + remark + rehype-sanitize would add
// tens of KB and a non-trivial dependency tree for a markdown surface that
// is deliberately small. This module supports the subset that actually
// covers the editorial prose those two surfaces ship:
//
//   - ATX headings  (# .. ###### at line start)
//   - Fenced code   (```lang\n...\n```)
//   - Blockquotes   (> …)
//   - Unordered lists (- / * at line start, blank line ends the list)
//   - Ordered lists   (1. … at line start)
//   - Inline: **bold**, *italic*, `code`, [text](url) (http/https only)
//   - Paragraphs     (blank-line separated)
//
// XSS: every string is rendered as a React child (text or structured element);
// `dangerouslySetInnerHTML` is never used. URLs are scheme-filtered to http(s)
// before being rendered as <a href>. No raw HTML passthrough.

import { Fragment, type ReactNode } from "react";

type Block =
  | { kind: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { kind: "code"; lang: string; body: string }
  | { kind: "blockquote"; lines: string[] }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "paragraph"; text: string }
  | { kind: "blank" };

const FENCE_RE = /^```(\w*)\s*$/;
const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const UL_RE = /^[-*]\s+(.*)$/;
const OL_RE = /^\d+\.\s+(.*)$/;
const QUOTE_RE = /^>\s?(.*)$/;

/** Parse a markdown source string into a flat list of blocks. */
export function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";

    // Fenced code block
    const fence = FENCE_RE.exec(line);
    if (fence) {
      const lang = fence[1] ?? "";
      const bodyLines: string[] = [];
      i += 1;
      while (i < lines.length && !FENCE_RE.test(lines[i] ?? "")) {
        bodyLines.push(lines[i] ?? "");
        i += 1;
      }
      // consume closing fence (or EOF)
      if (i < lines.length) i += 1;
      out.push({ kind: "code", lang, body: bodyLines.join("\n") });
      continue;
    }

    // Heading
    const h = HEADING_RE.exec(line);
    if (h) {
      const hashes = h[1] ?? "#";
      const text = h[2] ?? "";
      const level = Math.min(6, hashes.length) as 1 | 2 | 3 | 4 | 5 | 6;
      out.push({ kind: "heading", level, text: text.trim() });
      i += 1;
      continue;
    }

    // Blockquote (consume contiguous > lines)
    if (QUOTE_RE.test(line)) {
      const qLines: string[] = [];
      while (i < lines.length && QUOTE_RE.test(lines[i] ?? "")) {
        const m = QUOTE_RE.exec(lines[i] ?? "");
        qLines.push(m?.[1] ?? "");
        i += 1;
      }
      out.push({ kind: "blockquote", lines: qLines });
      continue;
    }

    // Unordered list
    if (UL_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && UL_RE.test(lines[i] ?? "")) {
        const m = UL_RE.exec(lines[i] ?? "");
        items.push(m?.[1] ?? "");
        i += 1;
      }
      out.push({ kind: "ul", items });
      continue;
    }

    // Ordered list
    if (OL_RE.test(line)) {
      const items: string[] = [];
      while (i < lines.length && OL_RE.test(lines[i] ?? "")) {
        const m = OL_RE.exec(lines[i] ?? "");
        items.push(m?.[1] ?? "");
        i += 1;
      }
      out.push({ kind: "ol", items });
      continue;
    }

    // Blank
    if (line.trim() === "") {
      out.push({ kind: "blank" });
      i += 1;
      continue;
    }

    // Paragraph — accumulate until blank or structural token
    const paraLines: string[] = [line];
    i += 1;
    while (i < lines.length) {
      const l = lines[i] ?? "";
      if (
        l.trim() === "" ||
        FENCE_RE.test(l) ||
        HEADING_RE.test(l) ||
        UL_RE.test(l) ||
        OL_RE.test(l) ||
        QUOTE_RE.test(l)
      ) {
        break;
      }
      paraLines.push(l);
      i += 1;
    }
    out.push({ kind: "paragraph", text: paraLines.join(" ") });
  }
  return out;
}

/** Token-level inline parser: **bold**, *italic*, `code`, [text](url). */
type InlineNode =
  | { kind: "text"; value: string }
  | { kind: "code"; value: string }
  | { kind: "bold"; children: InlineNode[] }
  | { kind: "italic"; children: InlineNode[] }
  | { kind: "link"; href: string; children: InlineNode[] };

export function parseInline(src: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let i = 0;
  let buf = "";

  const flushText = () => {
    if (buf.length > 0) {
      nodes.push({ kind: "text", value: buf });
      buf = "";
    }
  };

  while (i < src.length) {
    const ch = src[i];

    // Inline code
    if (ch === "`") {
      const end = src.indexOf("`", i + 1);
      if (end !== -1) {
        flushText();
        nodes.push({ kind: "code", value: src.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    // Bold **...**
    if (ch === "*" && src[i + 1] === "*") {
      const end = src.indexOf("**", i + 2);
      if (end !== -1 && end > i + 2) {
        flushText();
        nodes.push({ kind: "bold", children: parseInline(src.slice(i + 2, end)) });
        i = end + 2;
        continue;
      }
    }

    // Italic *...* (single star, non-greedy, refuse spaces on the inner edges
    // so "a * b * c" isn't mis-parsed as italics around " b ").
    if (ch === "*") {
      const end = src.indexOf("*", i + 1);
      if (end !== -1 && end > i + 1) {
        const inner = src.slice(i + 1, end);
        if (!/^\s|\s$/.test(inner)) {
          flushText();
          nodes.push({ kind: "italic", children: parseInline(inner) });
          i = end + 1;
          continue;
        }
      }
    }

    // Link [text](url)
    if (ch === "[") {
      const close = src.indexOf("]", i + 1);
      if (close !== -1 && src[close + 1] === "(") {
        const urlEnd = src.indexOf(")", close + 2);
        if (urlEnd !== -1) {
          const text = src.slice(i + 1, close);
          const href = src.slice(close + 2, urlEnd).trim();
          if (/^https?:\/\//i.test(href)) {
            flushText();
            nodes.push({ kind: "link", href, children: parseInline(text) });
            i = urlEnd + 1;
            continue;
          }
        }
      }
    }

    buf += ch;
    i += 1;
  }
  flushText();
  return nodes;
}

function renderInline(nodes: InlineNode[]): ReactNode[] {
  return nodes.map((n, idx) => {
    switch (n.kind) {
      case "text":
        return <Fragment key={idx}>{n.value}</Fragment>;
      case "code":
        return (
          <code
            key={idx}
            className="mono rounded-[3px] bg-[rgba(38,139,210,0.10)] px-[0.35em] py-[0.05em] text-[0.92em] text-sol-blue"
          >
            {n.value}
          </code>
        );
      case "bold":
        return (
          <strong key={idx} className="font-semibold text-solar-800">
            {renderInline(n.children)}
          </strong>
        );
      case "italic":
        return (
          <em key={idx} className="italic">
            {renderInline(n.children)}
          </em>
        );
      case "link":
        return (
          <a
            key={idx}
            href={n.href}
            target="_blank"
            rel="noreferrer"
            className="text-coral-600 underline decoration-coral-300 underline-offset-2 hover:decoration-coral-500"
          >
            {renderInline(n.children)}
          </a>
        );
    }
  });
}

/** Render markdown source as React children. */
export function renderMarkdown(src: string): ReactNode {
  const blocks = parseBlocks(src);
  const out: ReactNode[] = [];
  blocks.forEach((b, idx) => {
    switch (b.kind) {
      case "blank":
        return;
      case "heading": {
        const sizeByLevel: Record<number, string> = {
          1: "text-3xl sm:text-4xl",
          2: "text-2xl sm:text-3xl",
          3: "text-xl sm:text-2xl",
          4: "text-lg",
          5: "text-base",
          6: "text-sm uppercase tracking-[0.22em]",
        };
        const topMargin = idx === 0 ? "mt-0" : "mt-8";
        const cls = `font-serif font-semibold text-solar-800 ${topMargin} mb-3 ${sizeByLevel[b.level]}`;
        const children = renderInline(parseInline(b.text));
        switch (b.level) {
          case 1:
            out.push(<h1 key={idx} className={cls}>{children}</h1>);
            break;
          case 2:
            out.push(<h2 key={idx} className={cls}>{children}</h2>);
            break;
          case 3:
            out.push(<h3 key={idx} className={cls}>{children}</h3>);
            break;
          case 4:
            out.push(<h4 key={idx} className={cls}>{children}</h4>);
            break;
          case 5:
            out.push(<h5 key={idx} className={cls}>{children}</h5>);
            break;
          case 6:
            out.push(<h6 key={idx} className={cls}>{children}</h6>);
            break;
        }
        return;
      }
      case "code":
        out.push(
          <pre
            key={idx}
            data-lang={b.lang || undefined}
            className="mono my-4 overflow-x-auto rounded-sm border border-solar-200 bg-solar-100 px-4 py-3 text-[13px] leading-relaxed text-solar-800"
          >
            <code>{b.body}</code>
          </pre>
        );
        return;
      case "blockquote":
        out.push(
          <blockquote
            key={idx}
            className="my-4 border-l-2 border-coral-300 bg-solar-100/60 px-4 py-2 text-solar-700"
          >
            {b.lines.map((l, j) => (
              <p key={j} className="leading-relaxed">
                {renderInline(parseInline(l))}
              </p>
            ))}
          </blockquote>
        );
        return;
      case "ul":
        out.push(
          <ul key={idx} className="my-4 list-disc space-y-1 pl-6 text-solar-700 marker:text-coral-500">
            {b.items.map((it, j) => (
              <li key={j} className="leading-relaxed">
                {renderInline(parseInline(it))}
              </li>
            ))}
          </ul>
        );
        return;
      case "ol":
        out.push(
          <ol key={idx} className="my-4 list-decimal space-y-1 pl-6 text-solar-700 marker:text-coral-600">
            {b.items.map((it, j) => (
              <li key={j} className="leading-relaxed">
                {renderInline(parseInline(it))}
              </li>
            ))}
          </ol>
        );
        return;
      case "paragraph":
        out.push(
          <p key={idx} className="my-3 leading-[1.7] text-solar-700">
            {renderInline(parseInline(b.text))}
          </p>
        );
        return;
    }
  });
  return <>{out}</>;
}
