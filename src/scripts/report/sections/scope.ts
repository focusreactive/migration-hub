import { coverageOf, coveredPages, isFullCoverage, totalPages } from "../analysis/global-coverage.ts";
import type { ReportMetrics } from "../analysis/metrics.ts";
import { FONT_SOURCE_LABEL } from "../constants/font-source.ts";
import { SOURCE_LABEL } from "../constants/labels.ts";
import type { ReportInput } from "../types.ts";
import { collectionNameFromRoutePattern } from "../utils/collection-name.ts";
import { table } from "../utils/table.ts";

function collectionsReading(input: ReportInput): string {
  if (input.pages.collections.length === 0) return "—";

  return input.pages.collections
    .map((collection) => `${collectionNameFromRoutePattern(collection.routePattern)} (${collection.itemCount})`)
    .join(", ");
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names.at(-1) ?? ""}`;
}

function globalsReading(input: ReportInput): string {
  const types = input.globals.types;
  if (types.length === 0) return "—";

  const names = joinNames(types.map((type) => type.name));
  const coverages = types.map((type) => coverageOf(input, type.members));

  if (coverages.every((coverage) => isFullCoverage(coverage))) return `${names}, on every page`;

  const covered = coverages.map((coverage) => coveredPages(coverage));
  const total = Math.max(...coverages.map((coverage) => totalPages(coverage)));
  const lowest = Math.min(...covered);
  const highest = Math.max(...covered);
  const span = lowest === highest ? String(lowest) : `${lowest}–${highest}`;

  return `${names}, on ${span} of ${total} pages`;
}

function fontsReading(input: ReportInput): string {
  if (input.fonts.families.length === 0) return "—";

  return input.fonts.families
    .map((family) => {
      const weights = family.weights.length;
      return `${family.family} (${FONT_SOURCE_LABEL[family.classification]}), ${weights} ${weights === 1 ? "weight" : "weights"}`;
    })
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
        ["Shared globals", String(metrics.globals), globalsReading(input)],
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
