export function countLabel(count: number, singular: string, plural: string): string {
  return count === 1 ? `one ${singular}` : `${count} ${plural}`;
}

export function countWord(count: number): string {
  return count === 1 ? "one" : String(count);
}

export function sentenceCountWord(count: number): string {
  return count === 1 ? "One" : String(count);
}

export function sentenceCountLabel(count: number, singular: string, plural: string): string {
  return `${sentenceCountWord(count)} ${count === 1 ? singular : plural}`;
}
