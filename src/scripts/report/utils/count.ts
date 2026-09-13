export function countLabel(count: number, singular: string, plural: string): string {
  return count === 1 ? `one ${singular}` : `${count} ${plural}`;
}
