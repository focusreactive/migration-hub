import type { ComplexityAreaId, Rating } from "../analysis/complexity.ts";
import type { ReportMetrics } from "../analysis/metrics.ts";
import type { ReportInput } from "../types.ts";
import { countLabel } from "../utils/count.ts";
import { FONT_SOURCE_LABEL } from "./font-source.ts";
import { SOURCE_LABEL } from "./labels.ts";

export type ComplexityParagraph = (metrics: ReportMetrics, input: ReportInput, rating: Rating) => string;

function joinHosts(hosts: string[]): string {
  if (hosts.length <= 1) return hosts.join("");
  return `${hosts.slice(0, -1).join(", ")} and ${hosts.at(-1) ?? ""}`;
}

function hasSingleDynamicSegment(routePattern: string): boolean {
  return routePattern.split("/").filter((segment) => segment.startsWith(":")).length === 1;
}

function designSystemParagraph(metrics: ReportMetrics, input: ReportInput): string {
  const singleFamily = input.fonts.families.length === 1 ? input.fonts.families[0] : undefined;
  const fontsClause =
    singleFamily === undefined
      ? `${countLabel(metrics.fonts, "typeface", "typefaces")} across the type system`
      : `One typeface, ${singleFamily.family}, pulled from ${FONT_SOURCE_LABEL[singleFamily.classification]} in `
        + `${countLabel(singleFamily.weights.length, "weight", "weights")} and `
        + `${countLabel(singleFamily.styles.length, "style", "styles")}`;

  const licenseClause =
    metrics.licensedFonts === 0
      ? "nothing licensed, nothing self-hosted, nothing to re-purchase"
      : `${countLabel(metrics.licensedFonts, "family", "families")} licensed or self-hosted and in need of a `
        + "licence check before they move";

  const videoClause =
    metrics.videos === 0
      ? "no video anywhere on the site"
      : `${countLabel(metrics.videos, "video", "videos")} alongside them`;

  const hostingClause =
    metrics.assetHosts.length === 0
      ? ""
      : ` The only real task here is re-hosting: the assets are served from ${joinHosts(metrics.assetHosts)}, `
        + "and those URLs stop working when the site is unpublished.";

  return (
    `${fontsClause} — ${licenseClause}, and \`next/font\` handles it with no layout shift. The media library is `
    + `${countLabel(metrics.images, "unique image", "unique images")}, with ${videoClause}.${hostingClause}`
  );
}

function formsParagraph(metrics: ReportMetrics, input: ReportInput): string {
  const platform = SOURCE_LABEL[input.verdict];
  const postClause =
    metrics.platformHandledForms === metrics.forms
      ? `none of them post to an endpoint of their own — ${platform}'s built-in submission handler takes them`
      : `${countLabel(metrics.platformHandledForms, "of them does", "of them do")} not post to an endpoint of `
        + `their own, relying on ${platform}'s built-in submission handler instead`;

  return (
    `${countLabel(metrics.forms, "form collects", "forms collect")} input, and ${postClause}. That means there is `
    + "nothing to point the new site at, and the new site has to bring its own handler, spam protection and "
    + "notification routing, plus an export of the submissions already collected."
  );
}

function contentModelParagraph(metrics: ReportMetrics, input: ReportInput): string {
  const singleSegment =
    input.pages.collections.length > 0
    && input.pages.collections.every((collection) => hasSingleDynamicSegment(collection.routePattern));

  const shapeClause = singleSegment ? ", each with a single dynamic segment in its route" : "";

  return (
    `${countLabel(metrics.collections, "collection", "collections")}${shapeClause}. Collections like these map `
    + "almost one-to-one onto document types in Sanity or collections in Payload, and the route patterns "
    + "themselves tell us what the slug fields and templates need to be."
  );
}

function pageCompositionParagraph(metrics: ReportMetrics, _input: ReportInput, rating: Rating): string {
  const paceClause =
    rating === "Low"
      ? ""
      : " This is the area that sets the pace of the whole project.";

  return (
    `${metrics.sectionTypes} distinct section types across ${metrics.sectionInstances} instances is a wide `
    + `surface, and it is wide rather than deep — ${metrics.singleUseSectionTypes} of those types appear exactly `
    + "once. A section used once still needs a schema, a component and a round of visual QA, so a long tail "
    + "costs nearly as much as a reused set of the same size while giving back none of the leverage. "
    + `${metrics.dualSourceSectionTypes} types appear both as free-standing page-builder blocks and inside `
    + "collection templates, so those components have to accept content from two different sources — worth "
    + `deciding deliberately at the start rather than retrofitting later.${paceClause}`
  );
}

function contentVolumeParagraph(metrics: ReportMetrics, _input: ReportInput, rating: Rating): string {
  const passClause =
    rating === "Low"
      ? "That fits into a single automated migration pass with room to review every record by hand afterwards, "
        + "and it keeps the content freeze short."
      : "That is more than a record-by-record read-through can cover, so the import runs in batches with "
        + "sampled checks, and the content freeze has to be planned around that.";

  return (
    `${countLabel(metrics.entries, "published entry", "published entries")} across `
    + `${countLabel(metrics.collections, "collection", "collections")}. ${passClause}`
  );
}

export const COMPLEXITY_PARAGRAPHS: Record<ComplexityAreaId, ComplexityParagraph> = {
  contentModel: contentModelParagraph,
  pageComposition: pageCompositionParagraph,
  designSystem: designSystemParagraph,
  forms: formsParagraph,
  contentVolume: contentVolumeParagraph,
};
