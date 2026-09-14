import type { Rating } from "../analysis/complexity.ts";
import type { ReportMetrics } from "../analysis/metrics.ts";
import { SOURCE_LABEL } from "../constants/labels.ts";
import type { ReportInput } from "../types.ts";

export function headerSection(input: ReportInput, metrics: ReportMetrics, overall: Rating): string {
  const hostname = new URL(input.sourceUrl).hostname;
  const platform = SOURCE_LABEL[input.verdict];

  return [
    `# Migration assessment — ${hostname}`,
    "",
    `**Source platform:** ${platform} · **Routes analysed:** ${metrics.routes} `
    + `· **Unique layout pages:** ${metrics.uniqueLayoutPages} · **Overall complexity: ${overall}**`,
  ].join("\n");
}
