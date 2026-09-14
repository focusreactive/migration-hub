// Transcribed from docs/design/report.design.html:16-26 (the sticky header band).
import { CONSULTATION_URL } from "#report/constants/tools.ts";

import type { RenderContext } from "../render-context.ts";
import { FR_WORDMARK_SVG } from "../constants/svg.ts";
import { escapeAttr, escapeHtml } from "../utils/escape.ts";
import { formatReportDate } from "../utils/format-date.ts";

export function headerSection(ctx: RenderContext): string {
  const generatedAt = escapeHtml(formatReportDate(ctx.input.generatedAt));

  return `
  <div style="position: sticky; top: 0; z-index: 50;">
  <div style="display: flex; align-items: center; justify-content: space-between; height: 76px; padding: 0 40px; border-bottom: 1px solid #171717; background: rgba(0,0,0,0.82); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);">
    <div style="display: flex; align-items: center; gap: 18px;">
      ${FR_WORDMARK_SVG}
      <span style="width: 1px; height: 20px; background: #2c2c2c;"></span>
      <span style="font-size: 13px; color: #7b7b7b; letter-spacing: 0.01em;">Migration assessment</span>
    </div>
    <div style="display: flex; align-items: center; gap: 20px;">
      <span style="font-size: 13px; color: #545454;">Generated ${generatedAt}</span>
      <a href="${escapeAttr(CONSULTATION_URL)}" class="btn" style="height: 38px; font-size: 13.5px; padding: 0 18px;">Book a consultation</a>
    </div>
  </div>
  <div style="height: 2px; background: #171717;"><div id="scrollProgress" style="height: 2px; width: 0%; background: #00e56d;"></div></div>
  </div>`;
}
