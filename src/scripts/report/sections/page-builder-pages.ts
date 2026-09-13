import type { ReportMetrics } from "../analysis/metrics.ts";
import type { ReportInput } from "../types.ts";
import { countLabel } from "../utils/count.ts";
import { pageLabel } from "../utils/page-label.ts";
import { table } from "../utils/table.ts";

export function pageBuilderPagesSection(input: ReportInput, metrics: ReportMetrics): string {
  const staticPages = input.pages.pages.filter((page) => page.kind === "static");

  return [
    "## Page-builder pages",
    "",
    `${countLabel(metrics.staticPages, "page stands", "pages stand")} on their own rather than being generated `
      + "from a collection. Each is assembled section by section, so its sections are configured by hand as "
      + "page-builder blocks — added, reordered and edited per page rather than driven by a template.",
    "",
    table(
      ["Page", "Slug"],
      staticPages.map((page) => {
        const label = pageLabel(page.route);
        return [label.name, `\`${label.slug}\``];
      }),
    ),
  ].join("\n");
}
