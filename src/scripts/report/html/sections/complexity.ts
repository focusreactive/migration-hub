// Transcribed from docs/design/report.design.html:79-154 (the complexity assessment band).
import { COMPLEXITY_PARAGRAPHS } from "#report/constants/complexity-copy.ts";

import type { Rating } from "../../analysis/complexity.ts";
import type { RenderContext } from "../render-context.ts";
import { clampSentences } from "../utils/clamp.ts";
import { escapeHtml } from "../utils/escape.ts";
import { inlineMarkdown } from "../utils/inline-markdown.ts";

const RATING_SEGMENTS: Record<Rating, number> = { Low: 1, Medium: 2, High: 3 };

const RATING_COLOR: Record<Rating, string> = {
  Low: "#00e56d",
  Medium: "#f2c94c",
  High: "#ef4444",
};

const UNFILLED_COLOR = "#1e1e1e";
const SEGMENT_COUNT = 3;

function meter(rating: Rating): string {
  const filled = RATING_SEGMENTS[rating];
  const color = RATING_COLOR[rating];

  const segments = Array.from({ length: SEGMENT_COUNT }, (_, index) => {
    const background = index < filled ? color : UNFILLED_COLOR;
    return `<span style="height: 6px; flex: 1; border-radius: 3px; background: ${background};"></span>`;
  }).join("");

  return `<div style="display: flex; gap: 4px; margin-top: 14px;">${segments}</div>`;
}

function card(ctx: RenderContext, areaIndex: number): string {
  const area = ctx.areas[areaIndex];
  if (area === undefined) return "";

  const color = RATING_COLOR[area.rating];
  const paragraph = clampSentences(
    inlineMarkdown(COMPLEXITY_PARAGRAPHS[area.id](ctx.metrics, ctx.input, area.rating)),
    3,
  );

  return `
        <div class="card" style="display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 40px; padding: 26px 30px; align-items: start;">
          <div>
            <h3 class="sub">${escapeHtml(area.label)}</h3>
            ${meter(area.rating)}
            <div style="font-size: 13px; color: ${color}; margin-top: 10px; font-weight: 600;">${escapeHtml(area.rating)}</div>
          </div>
          <p class="body">${paragraph}</p>
        </div>`;
}

export function complexitySection(ctx: RenderContext): string {
  const cards = ctx.areas.map((_, index) => card(ctx, index)).join("");

  return `
  <div class="band">
    <div class="wrap">
      <h2 class="sec">Complexity assessment</h2>
      <p class="lead">Nothing here is a judgement call &mdash; every rating comes from thresholds over the numbers above.</p>

      <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 44px;">
${cards}
      </div>
    </div>
  </div>`;
}
