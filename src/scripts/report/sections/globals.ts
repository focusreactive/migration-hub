import { coverageOf, coveragePhrase, isFullCoverage, type GlobalCoverage } from "../analysis/global-coverage.ts";
import type { ReportMetrics } from "../analysis/metrics.ts";
import type { ReportInput } from "../types.ts";
import { sentenceCountLabel } from "../utils/count.ts";
import { table } from "../utils/table.ts";
import { wordNumber } from "../utils/word-number.ts";

function collectionsClause(total: number): string {
  if (total === 0) return "";
  if (total === 1) return " and the collection template page";
  if (total === 2) return " and both collection template pages";
  return ` and all ${wordNumber(total)} collection template pages`;
}

function appearsOnCell(coverage: GlobalCoverage): string {
  if (isFullCoverage(coverage)) return `every page-builder page${collectionsClause(coverage.collectionsTotal)}`;

  const parts: string[] = [];

  if (coverage.staticTotal > 0) {
    parts.push(
      coveragePhrase(coverage.staticCovered, coverage.staticTotal, "page-builder page", "page-builder pages"),
    );
  }

  if (coverage.collectionsTotal > 0) {
    parts.push(
      coveragePhrase(
        coverage.collectionsCovered,
        coverage.collectionsTotal,
        "collection template page",
        "collection template pages",
      ),
    );
  }

  return parts.join(" and ");
}

function leadLine(input: ReportInput, metrics: ReportMetrics): string {
  const coverages = input.globals.types.map((type) => coverageOf(input, type.members));
  const subject = sentenceCountLabel(metrics.globals, "section is", "sections are");

  if (coverages.every((coverage) => isFullCoverage(coverage))) {
    const collections = coverages[0]?.collectionsTotal ?? 0;
    return (
      `${subject} shared rather than placed per page. `
      + `${metrics.globals === 1 ? "It wraps" : "They wrap"} every page-builder page`
      + `${collectionsClause(collections)}, so ${metrics.globals === 1 ? "it is" : "each is"} authored once `
      + "and reused everywhere."
    );
  }

  return (
    `${subject} shared rather than placed per page, so ${metrics.globals === 1 ? "it is" : "each is"} authored `
    + "once and reused everywhere instead of being rebuilt page by page."
  );
}

export function globalsSection(input: ReportInput, metrics: ReportMetrics): string {
  if (metrics.globals === 0) return ["## Global sections", "", "No globals found."].join("\n");

  return [
    "## Global sections",
    "",
    leadLine(input, metrics),
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
