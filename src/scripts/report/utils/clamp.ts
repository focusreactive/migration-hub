const SENTENCE_END = /[.!?]+(?=\s|$)/g;

export function clampSentences(value: string, max: number): string {
  if (max <= 0) return "";

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
  if (/\s/.test(value.charAt(max))) return `${cut.trimEnd()}…`;

  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
