export interface StripRow<T> {
  cells: (T | null)[];
  reversed: boolean;
  bridgeColumn: number | null;
}

export function chunkStripRows<T>(items: T[], perRow: number): StripRow<T>[] {
  if (items.length === 0 || perRow <= 0) return [];

  const rowCount = Math.ceil(items.length / perRow);
  const rows: StripRow<T>[] = [];

  for (let index = 0; index < rowCount; index += 1) {
    const slice = items.slice(index * perRow, (index + 1) * perRow);
    const cells: (T | null)[] = [...slice];
    while (cells.length < perRow) cells.push(null);

    const reversed = index % 2 === 1;
    const isLast = index === rowCount - 1;

    rows.push({
      cells,
      reversed,
      bridgeColumn:
        isLast ? null
        : reversed ? 0
        : perRow - 1,
    });
  }

  return rows;
}
