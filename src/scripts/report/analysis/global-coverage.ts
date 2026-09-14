import type { ReportInput } from "../types.ts";

export interface GlobalCoverage {
  staticCovered: number;
  staticTotal: number;
  collectionsCovered: number;
  collectionsTotal: number;
}

export function coverageOf(input: ReportInput, members: { route: string }[]): GlobalCoverage {
  const memberRoutes = new Set(members.map((member) => member.route));
  const pageBuilderPages = input.pages.pages.filter((page) => page.kind === "static");
  const staticCovered = pageBuilderPages.filter((page) => memberRoutes.has(page.route)).length;

  const collectionsCovered = input.pages.collections.filter((collection) =>
    input.pages.pages.some(
      (page) => page.kind === "item" && page.collectionKey === collection.key && memberRoutes.has(page.route),
    ),
  ).length;

  return {
    staticCovered,
    staticTotal: pageBuilderPages.length,
    collectionsCovered,
    collectionsTotal: input.pages.collections.length,
  };
}

export function isFullCoverage(coverage: GlobalCoverage): boolean {
  return (
    coverage.staticCovered === coverage.staticTotal && coverage.collectionsCovered === coverage.collectionsTotal
  );
}

export function coveredPages(coverage: GlobalCoverage): number {
  return coverage.staticCovered + coverage.collectionsCovered;
}

export function totalPages(coverage: GlobalCoverage): number {
  return coverage.staticTotal + coverage.collectionsTotal;
}

export function coveragePhrase(covered: number, total: number, singular: string, plural: string): string {
  if (covered === total) return total === 1 ? `the ${singular}` : `all ${total} ${plural}`;
  if (covered === 0) return `no ${total === 1 ? singular : plural}`;
  return `${covered} of ${total} ${plural}`;
}

export function coverageSpanPhrase(
  lowest: number,
  highest: number,
  total: number,
  singular: string,
  plural: string,
): string {
  if (lowest === highest) return coveragePhrase(lowest, total, singular, plural);
  return `${lowest}–${highest} of ${total} ${plural}`;
}
