// Transcribed from docs/design/report.design.html:28-50 (the hero band).
import { SOURCE_LABEL } from "#report/constants/labels.ts";

import type { Rating } from "../../analysis/complexity.ts";
import type { RenderContext } from "../render-context.ts";
import { ICON_EXTERNAL } from "../constants/svg.ts";
import { clampSentences } from "../utils/clamp.ts";
import { escapeAttr, escapeHtml } from "../utils/escape.ts";

const COMPLEXITY_CHIP_STYLE: Record<Rating, string> = {
  Low: "border-color: #153d28; background: #081a10; color: #00e56d;",
  Medium: "border-color: #3d3416; background: #1a1608; color: #f2c94c;",
  High: "border-color: #3d1616; background: #1a0808; color: #ef4444;",
};

const HOME_ROUTE = "/";

// The type whose exemplar sits on the home route, at the lowest order among the
// non-global (block) types, is the section the design's hero shot comes from.
function heroShotTypeId(ctx: RenderContext): string | undefined {
  let best: { id: string; order: number } | undefined;

  for (const type of ctx.input.blocks.types) {
    if (type.exemplar.route !== HOME_ROUTE) continue;
    if (best === undefined || type.exemplar.order < best.order) best = { id: type.id, order: type.exemplar.order };
  }

  return best?.id;
}

function heroImage(ctx: RenderContext): string {
  const typeId = heroShotTypeId(ctx);
  if (typeId === undefined || !ctx.shots.has(typeId)) return "";

  return `<img data-shot="${escapeAttr(typeId)}" class="shot" alt="${escapeAttr("Home page hero")}" />`;
}

export function heroSection(ctx: RenderContext): string {
  const sourceLabel = SOURCE_LABEL[ctx.input.verdict];
  const hostname = escapeHtml(new URL(ctx.input.sourceUrl).hostname);
  const homeHref = escapeAttr(ctx.linker.href("/"));
  const lead = escapeHtml(clampSentences(ctx.input.narrative.site, 2));
  const body = escapeHtml(clampSentences(ctx.input.narrative.design, 4));
  const complexityStyle = COMPLEXITY_CHIP_STYLE[ctx.overall];
  const image = heroImage(ctx);

  return `
  <div class="wrap" style="padding-top: 96px; padding-bottom: 96px;">
    <div class="eyebrow"><span class="dot"></span>${escapeHtml(sourceLabel)} &rarr; headless cms</div>
    <h1 style="font-size: 76px; line-height: 0.98; letter-spacing: -0.04em; font-weight: 600; margin: 22px 0 0;">${hostname}</h1>

    <div style="display: flex; align-items: center; gap: 10px; margin-top: 28px; flex-wrap: wrap;">
      <a href="${homeHref}" target="_blank" rel="noreferrer" class="chip chip-link">${hostname}${ICON_EXTERNAL}</a>
      <span class="chip">Source platform &middot; ${escapeHtml(sourceLabel)}</span>
      <span class="chip">${ctx.metrics.pages} pages analysed</span>
      <span class="chip" style="${complexityStyle}">Overall complexity &middot; ${escapeHtml(ctx.overall)}</span>
    </div>

    <div style="display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 56px; margin-top: 64px; align-items: start;">
      <div style="display: flex; flex-direction: column; gap: 22px;">
        <p style="font-size: 21px; line-height: 1.55; color: #e8e8e8; margin: 0; letter-spacing: -0.01em; text-wrap: pretty;">${lead}</p>
        <p class="body" style="font-size: 16px; line-height: 1.68; text-wrap: pretty;">${body}</p>
      </div>
      ${image}
    </div>

  </div>`;
}
