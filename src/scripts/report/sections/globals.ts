import type { ReportMetrics } from "../analysis/metrics.ts";
import type { ReportInput } from "../types.ts";
import { countLabel } from "../utils/count.ts";
import { table } from "../utils/table.ts";
import { wordNumber } from "../utils/word-number.ts";

interface GlobalCoverage {
  staticCovered: number;
  staticTotal: number;
  collectionsCovered: number;
  collectionsTotal: number;
}

function coverageOf(input: ReportInput, members: { route: string }[]): GlobalCoverage {
  const memberRoutes = new Set(members.map((member) => member.route));
  const staticPages = input.pages.pages.filter((page) => page.kind === "static");
  const staticCovered = staticPages.filter((page) => memberRoutes.has(page.route)).length;

  const collectionsCovered = input.pages.collections.filter((collection) =>
    input.pages.pages.some(
      (page) => page.kind === "item" && page.collectionKey === collection.key && memberRoutes.has(page.route),
    ),
  ).length;

  return {
    staticCovered,
    staticTotal: staticPages.length,
    collectionsCovered,
    collectionsTotal: input.pages.collections.length,
  };
}

function collectionsClause(total: number): string {
  if (total === 0) return "";
  if (total === 1) return " and the collection template";
  return ` and all ${wordNumber(total)} collection templates`;
}

function appearsOnCell(coverage: GlobalCoverage): string {
  const { staticCovered, staticTotal, collectionsCovered, collectionsTotal } = coverage;
  const isFull = staticCovered === staticTotal && collectionsCovered === collectionsTotal;

  if (isFull) return `every page-builder page${collectionsClause(collectionsTotal)}`;

  return `${staticCovered + collectionsCovered} of ${staticTotal + collectionsTotal} pages`;
}

export function globalsSection(input: ReportInput, metrics: ReportMetrics): string {
  if (metrics.globals === 0) return ["## Global sections", "", "No globals found."].join("\n");

  return [
    "## Global sections",
    "",
    `${countLabel(metrics.globals, "section is", "sections are")} shared rather than placed per page. They wrap `
      + "every page-builder page and every collection template, so each is authored once and reused everywhere.",
    "",
    table(
      ["Global", "Instances", "Appears on"],
      input.globals.types.map((type) => [
        type.name,
        String(type.instanceCount),
        appearsOnCell(coverageOf(input, type.members)),
      ]),
    ),
  ].join("\n");
}
