import type { ReportInput } from "../types.ts";

export interface GlobalCoverage {
  staticCovered: number;
  staticTotal: number;
  collectionsCovered: number;
  collectionsTotal: number;
}

export function coverageOf(input: ReportInput, members: { route: string }[]): GlobalCoverage {
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
