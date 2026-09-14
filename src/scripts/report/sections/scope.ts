import { coverageOf, coverageSpanPhrase, isFullCoverage, type GlobalCoverage } from "../analysis/global-coverage.ts";
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

function spanPhrase(
  covered: number[],
  total: number,
  singular: string,
  plural: string,
): string {
  return coverageSpanPhrase(Math.min(...covered), Math.max(...covered), total, singular, plural);
}

function coverageReading(coverages: GlobalCoverage[]): string {
  const staticTotal = Math.max(...coverages.map((coverage) => coverage.staticTotal));
  const collectionsTotal = Math.max(...coverages.map((coverage) => coverage.collectionsTotal));
  const parts: string[] = [];

  if (staticTotal > 0) {
    parts.push(
      spanPhrase(
        coverages.map((coverage) => coverage.staticCovered),
        staticTotal,
        "page-builder page",
        "page-builder pages",
      ),
    );
  }

  if (collectionsTotal > 0) {
    parts.push(
      spanPhrase(
        coverages.map((coverage) => coverage.collectionsCovered),
        collectionsTotal,
        "collection template",
        "collection templates",
      ),
    );
  }

  return parts.join(" and ");
}

function globalsReading(input: ReportInput): string {
  const types = input.globals.types;
  if (types.length === 0) return "—";

  const names = joinNames(types.map((type) => type.name));
  const coverages = types.map((type) => coverageOf(input, type.members));

  if (coverages.every((coverage) => isFullCoverage(coverage))) return `${names}, on every page`;

  return `${names}, on ${coverageReading(coverages)}`;
}

function sectionTypesReading(metrics: ReportMetrics): string {
  if (metrics.sectionTypes === 0) return "—";

  const instances = `${metrics.sectionInstances} ${metrics.sectionInstances === 1 ? "instance" : "instances"}`;
  if (metrics.singleUseSectionTypes === 0) return instances;

  return `${instances}; ${metrics.singleUseSectionTypes} used only once`;
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
        [
          "Pages",
          String(metrics.routes),
          `${metrics.staticPages} hand-composed, ${metrics.entries} CMS `
          + `${metrics.entries === 1 ? "entry" : "entries"}`,
        ],
        ["Collections", String(metrics.collections), collectionsReading(input)],
        ["Section types", String(metrics.sectionTypes), sectionTypesReading(metrics)],
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
