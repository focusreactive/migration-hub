import type { ComplexityArea } from "../analysis/complexity.ts";
import type { ReportMetrics } from "../analysis/metrics.ts";
import { complexityParagraph } from "../constants/complexity-copy.ts";
import type { ReportInput } from "../types.ts";
import { table } from "../utils/table.ts";

export function complexitySection(areas: ComplexityArea[], input: ReportInput, metrics: ReportMetrics): string {
  const paragraphs = areas.map(
    (area) => `**${area.label}.** ${complexityParagraph(area.id, metrics, input, area.rating)}`,
  );

  return [
    "## Complexity assessment",
    "",
    table(["Area", "Rating"], areas.map((area) => [area.label, `**${area.rating}**`])),
    "",
    paragraphs.join("\n\n"),
  ].join("\n");
}
