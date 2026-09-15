import type { DiscoveryContentKind } from "#ir/discovery.ts";
import type { PagesData } from "#ir/pages.ts";

import type { ReportMetrics } from "../analysis/metrics.ts";
import { KIND_LABEL } from "../constants/labels.ts";
import type { ReportInput } from "../types.ts";
import { countLabel, countWord } from "../utils/count.ts";
import { memberPageLabels } from "../utils/member-pages.ts";
import { table } from "../utils/table.ts";

export function memberPagesList(pages: PagesData, members: { route: string }[]): string {
  return memberPageLabels(pages, members)
    .map((member) => (member.isRoute ? `\`${member.label}\`` : member.label))
    .join(", ");
}

export function kindsLabel(kinds: DiscoveryContentKind[]): string {
  return kinds.map((kind) => KIND_LABEL[kind]).join(", ");
}

interface BreakdownClause {
  count: number;
  singular: string;
  plural: string;
}

function breakdownClauses(metrics: ReportMetrics): BreakdownClause[] {
  return [
    { count: metrics.reusedSectionTypes, singular: "appears more than once", plural: "appear more than once" },
    { count: metrics.singleUseSectionTypes, singular: "appears exactly once", plural: "appear exactly once" },
    {
      count: metrics.dualSourceSectionTypes,
      singular: "is used both as a page-builder block and inside a collection template page",
      plural: "are used both as page-builder blocks and inside collection template pages",
    },
    {
      count: metrics.collectionOnlySectionTypes,
      singular: "exists only inside a collection template page",
      plural: "exist only inside a collection template page",
    },
  ].filter((clause) => clause.count > 0);
}

export function breakdown(metrics: ReportMetrics): string {
  const rendered = breakdownClauses(metrics).map((clause, index) => {
    const noun =
      index > 0 ? ""
      : clause.count === 1 ? " type"
      : " types";
    return `${countWord(clause.count)}${noun} ${clause.count === 1 ? clause.singular : clause.plural}`;
  });

  if (rendered.length <= 1) return rendered.join("");
  if (rendered.length === 2) return `${rendered[0]} and ${rendered[1]}`;

  return `${rendered.slice(0, -1).join(", ")}, and ${rendered.at(-1) ?? ""}`;
}

export function sectionLibrarySection(input: ReportInput, metrics: ReportMetrics): string {
  if (metrics.sectionTypes === 0) return ["## Section library", "", "No sections found."].join("\n");

  return [
    "## Section library",
    "",
    `The ${countLabel(metrics.uniqueLayoutPages, "unique layout page is", "unique layout pages are")} built from `
      + `${countLabel(metrics.sectionTypes, "distinct section type", "distinct section types")} `
      + `used ${metrics.sectionInstances === 1 ? "once" : `${metrics.sectionInstances} times`} in total: `
      + `${breakdown(metrics)}.`,
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
