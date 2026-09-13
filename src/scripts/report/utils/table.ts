function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|");
}

export function table(header: string[], rows: string[][]): string {
  const divider = header.map(() => "---");
  return [header, divider, ...rows].map((row) => `| ${row.map(escapeCell).join(" | ")} |`).join("\n");
}
