import type { ReportMetrics } from "../analysis/metrics.ts";
import { SOURCE_LABEL } from "../constants/labels.ts";
import type { ReportInput } from "../types.ts";
import { collectionNameFromRoutePattern } from "../utils/collection-name.ts";
import { countLabel } from "../utils/count.ts";
import { table } from "../utils/table.ts";

function collectionsReading(input: ReportInput): string {
  if (input.pages.collections.length === 0) return "—";

  return input.pages.collections
    .map((collection) => `${collectionNameFromRoutePattern(collection.routePattern)} (${collection.itemCount})`)
    .join(", ");
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function fontsReading(input: ReportInput): string {
  if (input.fonts.families.length === 0) return "—";

  return input.fonts.families
    .map(
      (family) =>
        `${family.family} (${capitalize(family.classification)}), ${countLabel(family.weights.length, "weight", "weights")}`,
    )
    .join("; ");
}

function formsQuantifier(count: number): string {
  if (count === 1) return "it is";
  if (count === 2) return "both";
  return "all";
}

function formsReading(input: ReportInput, metrics: ReportMetrics): string {
  if (metrics.forms === 0 || metrics.platformHandledForms !== metrics.forms) return "—";

  const platform = SOURCE_LABEL[input.verdict];
  return `${formsQuantifier(metrics.forms)} submitted to ${platform}'s endpoint`;
}

export function scopeSection(input: ReportInput, metrics: ReportMetrics): string {
  return [
    "## Scope at a glance",
    "",
    table(
      ["What", "Count", "Reading"],
      [
        ["Pages", String(metrics.routes), `${metrics.staticPages} hand-composed, ${metrics.entries} CMS entries`],
        ["Collections", String(metrics.collections), collectionsReading(input)],
        [
          "Section types",
          String(metrics.sectionTypes),
          `${metrics.sectionInstances} instances; ${metrics.singleUseSectionTypes} used only once`,
        ],
        ["Shared globals", String(metrics.globals), "Header and footer, on every page"],
        [
          "Images",
          String(metrics.images),
          metrics.duplicateAssets === 0
            ? "no duplicates found"
            : `plus ${metrics.duplicateAssets} ${metrics.duplicateAssets === 1 ? "duplicate" : "duplicates"} already de-duplicated`,
        ],
        ["Videos", String(metrics.videos), "—"],
        ["Font families", String(metrics.fonts), fontsReading(input)],
        ["Forms", String(metrics.forms), formsReading(input, metrics)],
      ],
    ),
  ].join("\n");
}
