const SENTENCE_END = /[.!?]+(?=\s|$)/g;

export function clampSentences(value: string, max: number): string {
  if (max <= 0) return "";

  // Scan for terminators rather than matching whole sentences. A `match`-and-join
  // approach silently DROPS any leading text whose first period is not followed by
  // whitespace: "Next.js requires Node.js 18. It also needs pnpm." clamped to one
  // sentence yielded "js 18.", losing everything before it.
  const pattern = new RegExp(SENTENCE_END);
  let seen = 0;
  let end = -1;

  for (let match = pattern.exec(value); match !== null; match = pattern.exec(value)) {
    seen += 1;
    end = match.index + (match[0] ?? "").length;
    if (seen === max) break;
  }

  return seen < max || end < 0 ? value : value.slice(0, end);
}

export function clampChars(value: string, max: number): string {
  if (value.length <= max) return value;

  const cut = value.slice(0, max);
  // The cut already ends on a word boundary when the next character is whitespace,
  // so the last word fits whole and must be kept.
  if (/\s/.test(value.charAt(max))) return `${cut.trimEnd()}…`;

  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
