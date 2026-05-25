"use client";

import { Bot, Loader2, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CodeBlock } from "@/components/code/server-code-block";
import { docsCorpus, type DocsSnippet } from "@/lib/docs/docs-corpus";
import { searchDocsCorpus } from "@/lib/docs/docs-search";

type DocsChatResponse = {
  answer: string;
  sources: DocsSnippet[];
  limited?: boolean;
  retryAfterSeconds?: number;
  mode?: "mock" | "cloudflare";
};

type SearchMode = "search" | "ai";

type AnswerBlock =
  | { type: "code"; code: string; lang: string }
  | { type: "list"; items: string[]; ordered: boolean }
  | { type: "paragraph"; text: string };

function parseAnswerBlocks(answer: string): AnswerBlock[] {
  const blocks: AnswerBlock[] = [];
  const lines = answer.split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    const fenceMatch = line.match(/^```(\w+)?/);
    if (fenceMatch) {
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      blocks.push({
        type: "code",
        code: codeLines.join("\n"),
        lang: fenceMatch[1] ?? "tsx",
      });
      index += 1;
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)/);
    if (orderedMatch) {
      const items: string[] = [];

      while (index < lines.length) {
        const itemMatch = lines[index].trim().match(/^\d+\.\s+(.+)/);
        if (!itemMatch) break;
        items.push(itemMatch[1]);
        index += 1;
      }

      blocks.push({ type: "list", items, ordered: true });
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)/);
    if (bulletMatch) {
      const items: string[] = [];

      while (index < lines.length) {
        const itemMatch = lines[index].trim().match(/^[-*]\s+(.+)/);
        if (!itemMatch) break;
        items.push(itemMatch[1]);
        index += 1;
      }

      blocks.push({ type: "list", items, ordered: false });
      continue;
    }

    const paragraphLines = [line.replace(/^#{1,4}\s+/, "")];
    index += 1;

    while (index < lines.length && lines[index].trim()) {
      const nextLine = lines[index].trim();
      if (nextLine.startsWith("```") || /^\d+\.\s+/.test(nextLine) || /^[-*]\s+/.test(nextLine))
        break;
      paragraphLines.push(nextLine.replace(/^#{1,4}\s+/, ""));
      index += 1;
    }

    blocks.push({ type: "paragraph", text: paragraphLines.join(" ") });
  }

  return blocks;
}

function InlineAnswerText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={`${part}-${index}`}
              className="border border-foreground/10 bg-background px-1 py-0.5 font-mono text-[0.68rem] text-foreground/78"
            >
              {part.slice(1, -1)}
            </code>
          );
        }

        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </>
  );
}

function DocsAnswer({ answer, sources }: { answer: string; sources: DocsSnippet[] }) {
  const blocks = parseAnswerBlocks(answer);

  return (
    <div className="mb-2 space-y-2 border border-foreground/8 bg-foreground/[0.035] p-2.5">
      <div className="space-y-2 text-xs leading-5 text-foreground/68">
        {blocks.map((block, index) => {
          if (block.type === "code") {
            return (
              <div key={`${block.type}-${index}`} className="text-[0.68rem]">
                <CodeBlock embedded lang={block.lang}>
                  {block.code}
                </CodeBlock>
              </div>
            );
          }

          if (block.type === "list") {
            const List = block.ordered ? "ol" : "ul";

            return (
              <List
                key={`${block.type}-${index}`}
                className={
                  block.ordered
                    ? "list-decimal space-y-1 pl-4 marker:text-foreground/38"
                    : "list-disc space-y-1 pl-4 marker:text-foreground/38"
                }
              >
                {block.items.map((item) => (
                  <li key={item}>
                    <InlineAnswerText text={item} />
                  </li>
                ))}
              </List>
            );
          }

          return (
            <p key={`${block.type}-${index}`}>
              <InlineAnswerText text={block.text} />
            </p>
          );
        })}
      </div>

      {sources.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 border-t border-foreground/8 pt-2">
          {sources.slice(0, 3).map((source, index) => (
            <a
              key={source.id}
              href={source.href}
              className="inline-flex h-6 items-center border border-foreground/10 bg-background/80 px-2 text-[0.65rem] font-semibold text-foreground/54 transition-colors hover:border-foreground/18 hover:text-foreground/78"
            >
              [{index + 1}] {source.title}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DocsNavSearch() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<SearchMode>("search");
  const [matches, setMatches] = useState<DocsSnippet[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [answer, setAnswer] = useState<DocsChatResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [isOpen, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    setAnswer(null);
    setStatus("idle");
    const nextMatches = trimmed ? searchDocsCorpus(trimmed, docsCorpus, 5) : [];
    setMatches(nextMatches);
    setActiveIndex(nextMatches.length > 0 ? 0 : -1);
    setOpen(trimmed.length > 0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) setActiveIndex(-1);
  }, [isOpen]);

  async function askAi() {
    const trimmed = query.trim();
    if (!trimmed || status === "loading") return;

    const snippets = searchDocsCorpus(trimmed, docsCorpus, 5);
    setMatches(snippets);
    setActiveIndex(snippets.length > 0 ? 0 : -1);
    setStatus("loading");
    setAnswer(null);
    setOpen(true);

    try {
      const response = await fetch("/api/docs-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: trimmed, snippets }),
      });
      const payload = (await response.json()) as DocsChatResponse;
      setAnswer(payload);
      setStatus(response.ok ? "idle" : "error");
    } catch {
      setStatus("error");
      setAnswer({
        answer:
          "AI is unavailable right now. The local docs matches below still point to the relevant sections.",
        sources: snippets,
      });
    }
  }

  return (
    <div ref={rootRef} className="relative hidden min-w-0 flex-1 justify-end md:flex">
      <form
        className="flex w-full max-w-xl items-center gap-1.5"
        onSubmit={(event) => {
          event.preventDefault();
          if (mode === "ai") {
            void askAi();
            return;
          }
          const firstMatch = matches[0];
          if (firstMatch) window.location.href = firstMatch.href;
        }}
      >
        <label className="relative min-w-0 flex-1">
          <Search
            size={13}
            aria-hidden="true"
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-foreground/30"
          />
          <input
            value={query}
            onFocus={() => setOpen(query.trim().length > 0)}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setOpen(false);
                return;
              }

              if (!matches.length) return;

              if (event.key === "ArrowDown") {
                event.preventDefault();
                setOpen(true);
                setActiveIndex((current) => (current + 1) % matches.length);
                return;
              }

              if (event.key === "ArrowUp") {
                event.preventDefault();
                setOpen(true);
                setActiveIndex((current) => (current <= 0 ? matches.length - 1 : current - 1));
                return;
              }

              if (event.key === "Home") {
                event.preventDefault();
                setActiveIndex(0);
                return;
              }

              if (event.key === "End") {
                event.preventDefault();
                setActiveIndex(matches.length - 1);
                return;
              }

              if (event.key === "Enter" && mode === "search" && activeIndex >= 0) {
                event.preventDefault();
                window.location.href = matches[activeIndex].href;
              }
            }}
            placeholder={mode === "ai" ? "Ask AI about the docs..." : "Search docs..."}
            maxLength={300}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls="docs-search-results"
            aria-activedescendant={
              isOpen && activeIndex >= 0
                ? `docs-search-result-${matches[activeIndex].id}`
                : undefined
            }
            className="h-7 w-full border border-foreground/10 bg-foreground/[0.035] pl-8 pr-3 text-xs text-foreground outline-none transition-colors placeholder:text-foreground/28 focus:border-foreground/22 focus:bg-background/90"
          />
        </label>
        <button
          type="button"
          aria-pressed={mode === "ai"}
          onClick={() => {
            setMode((current) => (current === "ai" ? "search" : "ai"));
            setOpen(query.trim().length > 0);
          }}
          className={
            mode === "ai"
              ? "inline-flex h-7 items-center gap-1.5 border border-foreground/18 bg-foreground px-2.5 text-[0.65rem] font-semibold text-background"
              : "inline-flex h-7 items-center gap-1.5 border border-foreground/10 bg-background/70 px-2.5 text-[0.65rem] font-semibold text-foreground/48 transition-colors hover:border-foreground/20 hover:text-foreground/72"
          }
        >
          <Bot size={12} aria-hidden="true" />
          AI
        </button>
      </form>

      {isOpen ? (
        <div
          id="docs-search-results"
          role="listbox"
          aria-label="Docs search results"
          className="absolute right-0 top-8 w-full max-w-xl border border-foreground/10 bg-background/98 p-2 shadow-2xl shadow-black/20 backdrop-blur-xl"
        >
          {mode === "ai" ? (
            <div className="mb-2 flex items-center justify-between border-b border-foreground/8 pb-2">
              <span className="text-[0.67rem] font-semibold uppercase tracking-[0.12em] text-foreground/36">
                Optional AI answer
              </span>
              <button
                type="button"
                disabled={!query.trim() || status === "loading"}
                onClick={() => void askAi()}
                className="inline-flex h-7 items-center gap-1.5 bg-foreground px-2.5 text-[0.68rem] font-semibold text-background disabled:cursor-not-allowed disabled:opacity-45"
              >
                {status === "loading" ? (
                  <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Bot size={12} aria-hidden="true" />
                )}
                {status === "loading" ? "Asking" : "Ask AI"}
              </button>
            </div>
          ) : null}

          {answer ? (
            <>
              <DocsAnswer answer={answer.answer} sources={answer.sources} />
              {answer.retryAfterSeconds ? (
                <p className="mt-1 text-[0.65rem] text-foreground/38">
                  Retry in {answer.retryAfterSeconds}s.
                </p>
              ) : null}
            </>
          ) : null}

          {matches.length > 0 ? (
            <div className="grid gap-1">
              {matches.map((match, index) => {
                const isActive = index === activeIndex;

                return (
                  <a
                    key={match.id}
                    id={`docs-search-result-${match.id}`}
                    href={match.href}
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={
                      isActive
                        ? "block border border-foreground/12 bg-foreground/[0.055] px-2.5 py-2 transition-colors"
                        : "block border border-transparent px-2.5 py-2 transition-colors hover:border-foreground/10 hover:bg-foreground/[0.035]"
                    }
                  >
                    <span className="text-xs font-semibold text-foreground/76">{match.title}</span>
                    <p className="mt-0.5 line-clamp-1 text-[0.68rem] text-foreground/42">
                      {match.body}
                    </p>
                  </a>
                );
              })}
            </div>
          ) : (
            <p className="px-2.5 py-2 text-xs text-foreground/42">No local docs matches yet.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
