// Assembles every band into the one self-contained HTML document. The skeleton is
// docs/design/report.design.html:1-15 and :1003-1007, with the three `<link
// rel="stylesheet">` to the foundations replaced by one inline `<style>` and the
// Google Fonts `<link>`.
import { kindsLabel } from "#report/sections/section-library.ts";
import { collectionNameFromRoutePattern } from "#report/utils/collection-name.ts";

import { GOOGLE_FONTS_HREF } from "./constants/fonts.ts";
import { PAGE_CSS, RESPONSIVE_CSS, SHOT_CSS, TOKENS_CSS } from "./constants/css.ts";
import { PAGE_SCRIPT } from "./constants/script.ts";
import { createRenderContext, type RenderContext } from "./render-context.ts";
import { closeSection } from "./sections/close.ts";
import { complexitySection } from "./sections/complexity.ts";
import { contentModelSection } from "./sections/content-model.ts";
import { formsSection } from "./sections/forms.ts";
import { globalsSection } from "./sections/globals.ts";
import { headerSection } from "./sections/header.ts";
import { heroSection } from "./sections/hero.ts";
import { mediaSection } from "./sections/media.ts";
import { migrationStepsSection } from "./sections/migration-steps.ts";
import { modalSection } from "./sections/modal.ts";
import { pageCompositionSection } from "./sections/page-composition.ts";
import { risksSection } from "./sections/risks.ts";
import { scopeSection } from "./sections/scope.ts";
import { memberPagesForCard, sectionLibrarySection } from "./sections/section-library.ts";
import { toolsSection } from "./sections/tools.ts";
import type { HtmlReportInput } from "./types.ts";
import { escapeHtml } from "./utils/escape.ts";
import { summaryForType } from "./utils/section-index.ts";

// Matches the design script's own `norm()` (src/scripts/report/html/constants/script.ts):
// lowercased, trimmed, internal whitespace collapsed — so `pageLink`'s lookup key
// always agrees with the keys this file builds.
function norm(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

interface TemplateLink {
  label: string;
  href: string;
  tip: string;
}

// __TPL__: one entry per collection with at least one published document, keyed by
// the normalized "<collection name> template page" label the section-library and
// page-composition bands already print as a member page's display name (see
// section-index.ts's pageTitle / section-library.ts's collectionMemberLabel). A
// collection with no exemplar has nothing to link to and is omitted, same as
// page-links.ts's collectionAnchor renders plain text rather than a broken link.
function templateLinks(ctx: RenderContext): Record<string, TemplateLink> {
  const { pages } = ctx.input;
  const origin = new URL(ctx.input.sourceUrl).origin;

  const exemplarRouteByKey = new Map<string, string>();
  for (const page of pages.pages) {
    if (page.kind !== "item" || page.collectionKey === undefined) continue;
    if (!exemplarRouteByKey.has(page.collectionKey)) exemplarRouteByKey.set(page.collectionKey, page.route);
  }

  const links: Record<string, TemplateLink> = {};
  for (const collection of pages.collections) {
    const exemplarRoute = exemplarRouteByKey.get(collection.key);
    if (exemplarRoute === undefined) continue;

    const label = `${collectionNameFromRoutePattern(collection.routePattern)} template page`;
    links[norm(label)] = {
      label: collection.routePattern,
      href: new URL(exemplarRoute, origin).toString(),
      tip: `Example document · ${exemplarRoute}`,
    };
  }

  return links;
}

interface GlobalDatum {
  name: string;
  count: string;
  kind: "Global";
  shot: string;
  pages: string;
  summary: string;
}

// __GLOBALS__: one entry per global type, in the shape the design script merges into
// its DATA map (see script.ts's `GLOBALS.forEach(function(d){ DATA[norm(d.name)] = d; })`).
function globalsData(ctx: RenderContext): GlobalDatum[] {
  return ctx.input.globals.types.map((type) => ({
    name: type.name,
    count: String(type.instanceCount),
    kind: "Global",
    shot: type.id,
    pages: memberPagesForCard(ctx.input.pages, type.members),
    summary:
      summaryForType({
        typeId: type.id,
        blocks: ctx.input.blocks,
        globals: ctx.input.globals,
        shards: ctx.input.shards,
      }) ?? "",
  }));
}

interface TypeDatum {
  name: string;
  count: string;
  kind: string;
  pages: string;
  summary: string;
}

// __TYPES__: keyed by typeId, covering both block and global types — everything that
// can appear as a `data-shot` value anywhere on the page (including page-composition
// tiles), so the modal can resolve a bare shot id back to its name/kind/pages/summary.
function typesData(ctx: RenderContext): Record<string, TypeDatum> {
  const types: Record<string, TypeDatum> = {};

  for (const type of ctx.input.blocks.types) {
    types[type.id] = {
      name: type.name,
      count: String(type.instanceCount),
      kind: kindsLabel(type.kinds),
      pages: memberPagesForCard(ctx.input.pages, type.members),
      summary:
        summaryForType({
          typeId: type.id,
          blocks: ctx.input.blocks,
          globals: ctx.input.globals,
          shards: ctx.input.shards,
        }) ?? "",
    };
  }

  for (const type of ctx.input.globals.types) {
    types[type.id] = {
      name: type.name,
      count: String(type.instanceCount),
      kind: "Global",
      pages: memberPagesForCard(ctx.input.pages, type.members),
      summary:
        summaryForType({
          typeId: type.id,
          blocks: ctx.input.blocks,
          globals: ctx.input.globals,
          shards: ctx.input.shards,
        }) ?? "",
    };
  }

  return types;
}

export function renderHtmlReport(input: HtmlReportInput): string {
  const ctx = createRenderContext(input);

  const bands = [
    heroSection(ctx),
    scopeSection(ctx),
    complexitySection(ctx),
    contentModelSection(ctx),
    sectionLibrarySection(ctx),
    pageCompositionSection(ctx),
    globalsSection(ctx),
    formsSection(ctx),
    mediaSection(ctx),
    risksSection(ctx),
    migrationStepsSection(ctx),
    toolsSection(ctx),
    closeSection(ctx),
  ].filter((band) => band !== "");

  const script = PAGE_SCRIPT.replace("__SITE__", () => JSON.stringify(new URL(input.sourceUrl).origin))
    .replace("__TPL__", () => JSON.stringify(templateLinks(ctx)))
    .replace("__GLOBALS__", () => JSON.stringify(globalsData(ctx)))
    .replace("__TYPES__", () => JSON.stringify(typesData(ctx)));

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>Migration assessment — ${escapeHtml(new URL(input.sourceUrl).hostname)}</title>`,
    `<link rel="preconnect" href="https://fonts.googleapis.com">`,
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`,
    `<link rel="stylesheet" href="${GOOGLE_FONTS_HREF}">`,
    `<style>${TOKENS_CSS}${PAGE_CSS}${RESPONSIVE_CSS}${SHOT_CSS}</style>`,
    "</head>",
    "<body>",
    '<div style="width: 100%; max-width: 1440px; margin: 0 auto; background: #000;">',
    headerSection(ctx),
    bands.join("\n"),
    "</div>",
    modalSection(),
    `<script>${ctx.shots.scriptMap()}${script}</script>`,
    "</body>",
    "</html>",
    "",
  ].join("\n");
}
