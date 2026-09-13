import type { DiscoveryContentKind } from "#ir/discovery.ts";
import type { PagesData } from "#ir/pages.ts";

import type { ReportMetrics } from "../analysis/metrics.ts";
import { KIND_LABEL } from "../constants/labels.ts";
import type { ReportInput } from "../types.ts";
import { collectionNameFromRoutePattern } from "../utils/collection-name.ts";
import { countLabel, countWord } from "../utils/count.ts";
import { table } from "../utils/table.ts";

function collectionNameForItemRoute(pages: PagesData, route: string): string | undefined {
  const page = pages.pages.find((candidate) => candidate.route === route);
  if (page?.kind !== "item") return undefined;

  const collection = pages.collections.find((candidate) => candidate.key === page.collectionKey);
  return collection === undefined ? route : collectionNameFromRoutePattern(collection.routePattern);
}

function dedupeInOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }

  return result;
}

export function memberPagesList(pages: PagesData, members: { route: string }[]): string {
  const staticRoutes: string[] = [];
  const collectionNames: string[] = [];

  for (const member of members) {
    const collectionName = collectionNameForItemRoute(pages, member.route);
    if (collectionName === undefined) staticRoutes.push(member.route);
    else collectionNames.push(collectionName);
  }

  const uniqueCollectionNames = dedupeInOrder(collectionNames);
  const parts = [...dedupeInOrder(staticRoutes).map((route) => `\`${route}\``), ...uniqueCollectionNames];

  if (uniqueCollectionNames.length === 0) return parts.join(", ");

  const suffix = uniqueCollectionNames.length > 1 ? "collection templates" : "collection template";
  return `${parts.join(", ")} (${suffix})`;
}

export function kindsLabel(kinds: DiscoveryContentKind[]): string {
  return kinds.map((kind) => KIND_LABEL[kind]).join(", ");
}

export function sectionLibrarySection(input: ReportInput, metrics: ReportMetrics): string {
  if (metrics.sectionTypes === 0) return ["## Section library", "", "No sections found."].join("\n");

  return [
    "## Section library",
    "",
    `The pages are built from ${countLabel(metrics.sectionTypes, "distinct section type", "distinct section types")} `
      + `used ${metrics.sectionInstances === 1 ? "once" : `${metrics.sectionInstances} times`} in total: `
      + `${countLabel(metrics.reusedSectionTypes, "type appears", "types appear")} more than once, `
      + `${countWord(metrics.singleUseSectionTypes)} `
      + `${metrics.singleUseSectionTypes === 1 ? "appears" : "appear"} exactly once, `
      + `${countWord(metrics.dualSourceSectionTypes)} `
      + `${metrics.dualSourceSectionTypes === 1 ? "is" : "are"} used both as page-builder blocks and inside `
      + `collection templates, and ${countWord(metrics.collectionOnlySectionTypes)} `
      + `${metrics.collectionOnlySectionTypes === 1 ? "exists" : "exist"} only inside a collection template.`,
    "",
    table(
      ["Section", "Instances", "Where it appears", "Used as"],
      input.blocks.types.map((type) => [
        type.name,
        String(type.instanceCount),
        memberPagesList(input.pages, type.members),
        kindsLabel(type.kinds),
      ]),
    ),
  ].join("\n");
}
