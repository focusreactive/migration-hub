// Transcribed from docs/design/report.design.html:580-618 (the media & typography band).
import type { FontFamilyRecord } from "#ir/assets.ts";
import { licenseClause } from "#report/constants/complexity-copy.ts";
import { FONT_SOURCE_LABEL } from "#report/constants/font-source.ts";

import type { RenderContext } from "../render-context.ts";
import { escapeHtml } from "../utils/escape.ts";

function altTextCard(ctx: RenderContext): string {
  if (ctx.metrics.images === 0) return "";

  return `<div class="card" style="padding: 30px 32px;">
          <h3 class="sub">Alt text coverage</h3>
          <div style="display: flex; align-items: baseline; gap: 12px; margin-top: 22px;">
            <span class="num" style="font-size: 54px; color: #ef4444;">${ctx.metrics.imagesWithoutAlt}</span>
            <span style="font-size: 15px; color: #9c9c9c;">of ${ctx.metrics.images} images have no alt text</span>
          </div>
          <div style="display: flex; gap: 3px; margin-top: 24px;">
            <span style="flex: ${ctx.metrics.imagesWithoutAlt}; height: 10px; border-radius: 5px; background: #ef4444;"></span>
            <span style="flex: ${ctx.metrics.images - ctx.metrics.imagesWithoutAlt}; height: 10px; border-radius: 5px; background: #00e56d;"></span>
          </div>
          <p class="body" style="font-size: 13.5px; margin-top: 16px;">That accessibility and SEO debt is copied into the new site verbatim unless it is addressed. The migration is the cheapest moment to fix it &mdash; but writing alt text is manual content work.</p>

          <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; margin-top: 28px; background: #1e1e1e; border: 1px solid #1e1e1e; border-radius: 12px; overflow: hidden;">
            <div style="background: #0a0a0a; padding: 18px 20px;"><div class="num" style="font-size: 26px;">${ctx.metrics.images}</div><div style="font-size: 12.5px; color: #7b7b7b; margin-top: 6px;">unique images</div></div>
            <div style="background: #0a0a0a; padding: 18px 20px;"><div class="num" style="font-size: 26px;">${ctx.metrics.duplicateAssets}</div><div style="font-size: 12.5px; color: #7b7b7b; margin-top: 6px;">duplicates collapsed</div></div>
            <div style="background: #0a0a0a; padding: 18px 20px;"><div class="num" style="font-size: 26px; color: #545454;">${ctx.metrics.videos}</div><div style="font-size: 12.5px; color: #7b7b7b; margin-top: 6px;">videos</div></div>
          </div>
        </div>`;
}

function fontRow(family: FontFamilyRecord): string {
  return `<div style="display: flex; align-items: baseline; justify-content: space-between; gap: 16px; padding-bottom: 14px;"><span style="font-size: 22px; letter-spacing: -0.01em;">${escapeHtml(family.family)}</span><span class="chip" style="height: 22px; font-size: 11px; padding: 0 9px;">${escapeHtml(FONT_SOURCE_LABEL[family.classification])}</span></div>`;
}

function typefacesClosingParagraph(ctx: RenderContext): string {
  if (ctx.metrics.licensedFonts === 0) {
    return 'Nothing licensed, nothing self-hosted, nothing to re-purchase &mdash; <span class="mono" style="color: #9c9c9c;">next/font</span> handles it with no layout shift.';
  }

  const clause = licenseClause(ctx.metrics);
  const capitalized = clause.charAt(0).toUpperCase() + clause.slice(1);

  return `${capitalized}, and <span class="mono" style="color: #9c9c9c;">next/font</span> handles it with no layout shift.`;
}

function typefacesCard(ctx: RenderContext): string {
  const chip = `${ctx.metrics.fonts} ${ctx.metrics.fonts === 1 ? "family" : "families"}`;
  const rows = ctx.input.fonts.families.map((family) => fontRow(family)).join("");

  return `<div class="card" style="padding: 30px 32px;">
          <div style="display: flex; align-items: baseline; justify-content: space-between;">
            <h3 class="sub">Typefaces</h3>
            <span class="chip" style="height: 22px; font-size: 11px; padding: 0 9px;">${escapeHtml(chip)}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 14px; margin-top: 26px;">
            ${rows}
          </div>
          <p class="body" style="font-size: 13px; margin-top: 24px;">${typefacesClosingParagraph(ctx)}</p>
        </div>`;
}

export function mediaSection(ctx: RenderContext): string {
  const cards = [altTextCard(ctx), typefacesCard(ctx)].filter((card) => card !== "").join("\n");

  return `
  <div class="band">
    <div class="wrap">
      <h2 class="sec">Media &amp; typography</h2>
      <p class="lead">Everything the pages load: the images and video behind the layouts, and the font families the type is set in.</p>

      <div style="display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 16px; margin-top: 44px; align-items: start;">
        ${cards}
      </div>
    </div>
  </div>`;
}
