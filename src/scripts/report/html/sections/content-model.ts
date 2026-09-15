// Transcribed from docs/design/report.design.html:155-190 (the content model band).
import type { PagesData } from "#ir/pages.ts";
import { collectionNameFromRoutePattern } from "#report/utils/collection-name.ts";

import type { RenderContext } from "../render-context.ts";
import { escapeHtml } from "../utils/escape.ts";
import { term } from "../utils/term.ts";

type Collection = PagesData["collections"][number];

function templateSectionCount(ctx: RenderContext, collection: Collection): number {
  const exemplar = ctx.input.pages.pages.find((page) => page.kind === "item" && page.collectionKey === collection.key);
  if (exemplar === undefined) return 0;

  const indexed = ctx.pagesIndex.find((page) => page.route === exemplar.route);
  return indexed?.sections.length ?? 0;
}

function card(ctx: RenderContext, collection: Collection, maxItemCount: number): string {
  const name = escapeHtml(collectionNameFromRoutePattern(collection.routePattern));
  // linker.collectionAnchor labels the anchor with the route pattern but links to a
  // real published document (rule 9); the codebase spells its separator as the
  // &middot; entity rather than the raw middle-dot character the linker returns.
  const anchor = ctx.linker.collectionAnchor(collection.key).replace("·", "&middot;");
  const width = maxItemCount === 0 ? 0 : Math.round((collection.itemCount / maxItemCount) * 100);
  const sections = templateSectionCount(ctx, collection);

  return `
        <div class="card" style="padding: 28px 26px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <h3 class="sub">${name}</h3>
            <span class="num" style="font-size: 30px;">${collection.itemCount}</span>
          </div>
          <div style="margin-top: 16px;">${anchor}</div>
          <div style="height: 4px; background: #1a1a1a; border-radius: 2px; margin-top: 22px;"><div style="height: 4px; width: ${width}%; background: #00e56d; border-radius: 2px;"></div></div>
          <div style="font-size: 12.5px; color: #545454; margin-top: 10px;">${sections} sections in its template page</div>
        </div>`;
}

function lead(ctx: RenderContext): string {
  const { collections } = ctx.metrics;
  const countLabel = collections === 1 ? "1 collection makes" : `${collections} collections make`;
  const subject = collections === 1 ? "It is" : "Each is";

  return (
    `${countLabel} up the CMS side of this site. ${subject} rendered through a single `
    + `${term("collectionTemplatePage")} that every ${term("collectionDocument", "document")} in it reuses, `
    + "so the documents below differ in content, not in layout."
  );
}

export function contentModelSection(ctx: RenderContext): string {
  if (ctx.metrics.collections === 0) return "";

  const { collections } = ctx.input.pages;
  const maxItemCount = Math.max(...collections.map((collection) => collection.itemCount));
  const cards = collections.map((collection) => card(ctx, collection, maxItemCount)).join("");

  return `
  <div class="band" style="background: #050505;">
    <div class="wrap">
      <h2 class="sec">Content model</h2>
      <p class="lead">${lead(ctx)}</p>

      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 44px;">
${cards}
      </div>
    </div>
  </div>`;
}
