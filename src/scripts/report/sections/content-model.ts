import type { ReportMetrics } from "../analysis/metrics.ts";
import type { ReportInput } from "../types.ts";
import { collectionNameFromRoutePattern } from "../utils/collection-name.ts";
import { sentenceCountLabel } from "../utils/count.ts";
import { table } from "../utils/table.ts";

export function contentModelSection(input: ReportInput, metrics: ReportMetrics): string {
  if (metrics.collections === 0) {
    return ["## Content model", "", "This site has no CMS collections — every page stands on its own."].join("\n");
  }

  return [
    "## Content model",
    "",
    `${sentenceCountLabel(metrics.collections, "collection makes", "collections make")} up the CMS side of this site. `
      + `${metrics.collections === 1 ? "It is" : "Each is"} rendered through a single template page that every `
      + "entry in it reuses, so the entries below differ in content, not in layout.",
    "",
    table(
      ["Collection", "Route pattern", "Entries"],
      input.pages.collections.map((collection) => [
        collectionNameFromRoutePattern(collection.routePattern),
        `\`${collection.routePattern}\``,
        String(collection.itemCount),
      ]),
    ),
  ].join("\n");
}
