import type { ReportMetrics } from "../analysis/metrics.ts";
import type { ReportInput } from "../types.ts";
import { sentenceCountLabel } from "../utils/count.ts";
import { displayRoute, pageLabel } from "../utils/page-label.ts";
import { table } from "../utils/table.ts";

export function pageBuilderPagesSection(input: ReportInput, metrics: ReportMetrics): string {
  if (metrics.pageBuilderPages === 0) {
    return [
      "## Page-builder pages",
      "",
      "Every page on this site is generated from a collection — none is composed by hand.",
    ].join("\n");
  }

  const pageBuilderPages = input.pages.pages.filter((page) => page.kind === "static");

  return [
    "## Page-builder pages",
    "",
    `${sentenceCountLabel(metrics.pageBuilderPages, "page-builder page stands", "page-builder pages stand")} on `
      + `${metrics.pageBuilderPages === 1 ? "its" : "their"} own rather than being generated `
      + `from a collection. ${metrics.pageBuilderPages === 1 ? "It is" : "Each is"} assembled section by section, so `
      + "its sections are configured by hand as page-builder blocks — added, reordered and edited per page "
      + "rather than driven by a template.",
    "",
    table(
      ["Page", "Route"],
      pageBuilderPages.map((page) => [pageLabel(page.route).name, `\`${displayRoute(page.route)}\``]),
    ),
  ].join("\n");
}
