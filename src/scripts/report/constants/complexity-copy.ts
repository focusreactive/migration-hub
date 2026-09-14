import type { ComplexityAreaId, Rating } from "../analysis/complexity.ts";
import type { ReportMetrics } from "../analysis/metrics.ts";
import type { ReportInput } from "../types.ts";
import { countLabel, countWord, sentenceCountLabel, sentenceCountWord } from "../utils/count.ts";
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

function typeSentence(metrics: ReportMetrics, input: ReportInput): string {
  if (metrics.fonts === 0) {
    return "No web font family is loaded at all — nothing licensed, nothing self-hosted, nothing to re-purchase.";
  }

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
        + `licence check before ${metrics.licensedFonts === 1 ? "it moves" : "they move"}`;

  return `${fontsClause} — ${licenseClause}, and \`next/font\` handles it with no layout shift.`;
}

function mediaSentence(metrics: ReportMetrics): string {
  if (metrics.images === 0) {
    return metrics.videos === 0
      ? "There is no image or video library to carry over."
      : `The media library is ${countLabel(metrics.videos, "video", "videos")} and no images at all.`;
  }

  const videoClause =
    metrics.videos === 0
      ? "no video anywhere on the site"
      : `${countLabel(metrics.videos, "video", "videos")} alongside them`;

  return `The media library is ${countLabel(metrics.images, "unique image", "unique images")}, with ${videoClause}.`;
}

function designSystemParagraph(metrics: ReportMetrics, input: ReportInput): string {
  const hostingClause =
    metrics.assetHosts.length === 0
      ? ""
      : ` The only real task here is re-hosting: the assets are served from ${joinHosts(metrics.assetHosts)}, `
        + "and those URLs stop working when the site is unpublished.";

  return `${typeSentence(metrics, input)} ${mediaSentence(metrics)}${hostingClause}`;
}

function formsParagraph(metrics: ReportMetrics, input: ReportInput): string {
  const platform = SOURCE_LABEL[input.verdict];

  if (metrics.forms === 0) {
    return (
      "No form collects input anywhere on this site, so there is no submission endpoint to replace and no "
      + "backlog of submissions to export."
    );
  }

  if (metrics.platformHandledForms === 0) {
    if (metrics.forms === 1) {
      return (
        "One form collects input, and it posts to an endpoint of its own rather than to "
        + `${platform}'s built-in handler. That endpoint carries over unchanged, so the new site has to `
        + "reproduce the fields and keep posting to it."
      );
    }

    return (
      `${sentenceCountLabel(metrics.forms, "form collects", "forms collect")} input, and every one of them posts `
      + `to an endpoint of its own rather than to ${platform}'s built-in handler. Those endpoints carry over `
      + "unchanged, so the new site has to reproduce the fields and keep posting to them."
    );
  }

  const postClause =
    metrics.platformHandledForms === metrics.forms
      ? metrics.forms === 1
        ? `it does not post to an endpoint of its own — ${platform}'s built-in submission handler takes it`
        : `none of them post to an endpoint of their own — ${platform}'s built-in submission handler takes them`
      : `${countLabel(metrics.platformHandledForms, "of them does", "of them do")} not post to an endpoint of `
        + `${metrics.platformHandledForms === 1 ? "its" : "their"} own, relying on ${platform}'s built-in `
        + "submission handler instead";

  return (
    `${sentenceCountLabel(metrics.forms, "form collects", "forms collect")} input, and ${postClause}. `
    + "That means there is nothing to point the new site at, and the new site has to bring its own handler, "
    + "spam protection and "
    + "notification routing, plus an export of the submissions already collected."
  );
}

function contentModelParagraph(metrics: ReportMetrics, input: ReportInput): string {
  if (metrics.collections === 0) {
    return (
      "This site has no CMS collections at all, so there are no document types to carry over — the content "
      + "model is only what the page-builder pages themselves need."
    );
  }

  const singleSegment = input.pages.collections.every((collection) =>
    hasSingleDynamicSegment(collection.routePattern),
  );

  const shapeClause = singleSegment
    ? metrics.collections === 1
      ? ", with a single dynamic segment in its route"
      : ", each with a single dynamic segment in its route"
    : "";

  return (
    `${sentenceCountLabel(metrics.collections, "collection", "collections")}${shapeClause}. `
    + "Collections like these map almost one-to-one onto document types in Sanity or collections in Payload, "
    + "and the route patterns "
    + "themselves tell us what the slug fields and templates need to be."
  );
}

function pageCompositionParagraph(metrics: ReportMetrics, _input: ReportInput, rating: Rating): string {
  if (metrics.sectionTypes === 0) {
    return "No page-builder section was found on this site, so there is no section library to rebuild.";
  }

  const surface =
    `${sentenceCountLabel(metrics.sectionTypes, "distinct section type", "distinct section types")} across `
    + `${countLabel(metrics.sectionInstances, "instance", "instances")}`;

  const sentences: string[] = [];

  if (metrics.singleUseSectionTypes === 0) {
    sentences.push(`${surface}, and every one of those types is reused.`);
  } else {
    const verb = metrics.singleUseSectionTypes === 1 ? "appears" : "appear";
    const count = countWord(metrics.singleUseSectionTypes);

    sentences.push(
      rating === "Low"
        ? `${surface}, of which ${count} ${verb} exactly once.`
        : `${surface} is a wide surface, and it is wide rather than deep — ${count} of those types ${verb} `
          + "exactly once.",
    );
    sentences.push(
      "A section used once still needs a schema, a component and a round of visual QA, so a long tail costs "
      + "nearly as much as a reused set of the same size while giving back none of the leverage.",
    );
  }

  if (metrics.dualSourceSectionTypes > 0) {
    sentences.push(
      `${sentenceCountWord(metrics.dualSourceSectionTypes)} `
      + `${metrics.dualSourceSectionTypes === 1 ? "type appears" : "types appear"} both as free-standing `
      + "page-builder blocks and inside collection template pages, so "
      + `${metrics.dualSourceSectionTypes === 1 ? "that component has" : "those components have"} to accept `
      + "content from two different sources — worth deciding deliberately at the start rather than "
      + "retrofitting later.",
    );
  }

  if (rating !== "Low") sentences.push("This is the area that sets the pace of the whole project.");

  return sentences.join(" ");
}

function contentVolumeParagraph(metrics: ReportMetrics, _input: ReportInput, rating: Rating): string {
  if (metrics.collections === 0) {
    return "There are no collection documents to import at all — every page on this site is composed by hand.";
  }

  if (metrics.collectionDocuments === 0) {
    return (
      `${sentenceCountLabel(metrics.collections, "collection is", "collections are")} in place, with no published `
      + "documents yet, so there is nothing to import beyond the collection template pages themselves."
    );
  }

  const passClause =
    rating === "Low"
      ? "That fits into a single automated migration pass with room to review every record by hand afterwards, "
        + "and it keeps the content freeze short."
      : "That is more than a record-by-record read-through can cover, so the import runs in batches with "
        + "sampled checks, and the content freeze has to be planned around that.";

  return (
    `${sentenceCountLabel(metrics.collectionDocuments, "published document", "published documents")} across `
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
