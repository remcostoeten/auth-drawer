import type { DocsSnippet } from "./docs-corpus";

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function searchDocsCorpus(
  query: string,
  corpus: DocsSnippet[],
  limit = 5,
) {
  const terms = normalize(query);
  if (terms.length === 0) return [];

  return corpus
    .map((snippet) => {
      const title = snippet.title.toLowerCase();
      const body = snippet.body.toLowerCase();
      const score = terms.reduce((total, term) => {
        if (title.includes(term)) return total + 4;
        if (body.includes(term)) return total + 1;
        return total;
      }, 0);

      return { snippet, score };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((result) => result.snippet);
}
