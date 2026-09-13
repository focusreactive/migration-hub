import type { ReportMetrics } from "../analysis/metrics.ts";
import { FONT_SOURCE_LABEL } from "../constants/font-source.ts";
import type { ReportInput } from "../types.ts";
import { table } from "../utils/table.ts";

export function mediaSection(input: ReportInput, metrics: ReportMetrics): string {
  const blocks = [
    "## Media & typography",
    "",
    "Everything the pages load: the images and video behind the layouts, and the font families the type is set in.",
    "",
    table(
      ["Media", "Count"],
      [
        ["Unique images", String(metrics.images)],
        ["Duplicates collapsed", String(metrics.duplicateAssets)],
        ["Videos", String(metrics.videos)],
        ["Images without alt text", String(metrics.imagesWithoutAlt)],
      ],
    ),
  ];

  if (input.fonts.families.length > 0) {
    blocks.push(
      "",
      table(
        ["Font family", "Weights", "Styles", "Source"],
        input.fonts.families.map((family) => [
          family.family,
          family.weights.join(", "),
          family.styles.join(", "),
          FONT_SOURCE_LABEL[family.classification],
        ]),
      ),
    );
  }

  return blocks.join("\n");
}
