import { TOOLS_BY_SOURCE } from "../constants/tools.ts";
import { table } from "../utils/table.ts";
import type { ReportInput } from "../types.ts";

export function toolsSection(input: ReportInput): string {
  return [
    "## Migrate this site yourself",
    "",
    "The analysis above was produced by our open pipeline, and the migration itself has open tooling too. If you "
      + "want to see the shape of the output before talking to anyone:",
    "",
    table(
      ["Target", "Tool"],
      TOOLS_BY_SOURCE[input.verdict].map((tool) => [tool.target, `[${tool.repo}](${tool.url})`]),
    ),
  ].join("\n");
}
