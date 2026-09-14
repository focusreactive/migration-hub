// Transcribed from docs/design/report.design.html:530-565 (the global sections band).
import { coverageOf, type GlobalCoverage } from "#report/analysis/global-coverage.ts";
import { leadLine } from "#report/sections/globals.ts";
import { countLabel } from "#report/utils/count.ts";

import type { RenderContext } from "../render-context.ts";
import { clampSentences } from "../utils/clamp.ts";
import { escapeHtml } from "../utils/escape.ts";
import { summaryForType } from "../utils/section-index.ts";

interface GlobalType {
  id: string;
  name: string;
  instanceCount: number;
  members: { route: string }[];
}

function capitalize(value: string): string {
  return value.length === 0 ? value : `${(value[0] ?? "").toUpperCase()}${value.slice(1)}`;
}

function coverageLine(coverage: GlobalCoverage): string {
  const staticLabel = escapeHtml(countLabel(coverage.staticCovered, "page-builder page", "page-builder pages"));
  const collectionsLabel = escapeHtml(
    countLabel(coverage.collectionsCovered, "collection template page", "collection template pages"),
  );

  return capitalize(`${staticLabel} &middot; ${collectionsLabel}`);
}

function bar(coverage: GlobalCoverage): string {
  const covered = coverage.staticCovered + coverage.collectionsCovered;
  const total = coverage.staticTotal + coverage.collectionsTotal;
  const uncovered = total - covered;

  const segments: string[] = [];
  if (coverage.staticCovered > 0) {
    segments.push(
      `<span style="flex: ${coverage.staticCovered}; height: 6px; border-radius: 3px; background: #00e56d;"></span>`,
    );
  }
  if (coverage.collectionsCovered > 0) {
    segments.push(
      `<span style="flex: ${coverage.collectionsCovered}; height: 6px; border-radius: 3px; background: #00be5a;"></span>`,
    );
  }
  if (uncovered > 0) {
    segments.push(`<span style="flex: ${uncovered}; height: 6px; border-radius: 3px; background: #262626;"></span>`);
  }

  return segments.join("");
}

function summaryParagraph(ctx: RenderContext, type: GlobalType): string {
  const raw =
    summaryForType({ typeId: type.id, blocks: ctx.input.blocks, globals: ctx.input.globals, shards: ctx.input.shards })
    ?? "";
  const summary = clampSentences(raw, 1);
  if (summary === "") return "";

  return `<p class="body" style="font-size: 13.5px; margin-top: 10px;">${escapeHtml(summary)}</p>`;
}

function card(ctx: RenderContext, type: GlobalType): string {
  const coverage = coverageOf(ctx.input, type.members);
  const shotBox = ctx.shots.box(type.id, type.name, {
    style: "aspect-ratio: 16 / 9; border: 1px solid #1e1e1e; border-radius: 10px;",
  });

  return `
        <div class="card" style="padding: 20px;">
          ${shotBox}
          <div style="display: flex; align-items: baseline; justify-content: space-between; margin-top: 20px;">
            <h3 class="sub">${escapeHtml(type.name)}</h3>
            <span class="num" style="font-size: 22px; color: #00e56d;">${type.instanceCount}</span>
          </div>
          ${summaryParagraph(ctx, type)}
          <div style="display: flex; gap: 3px; margin-top: 20px;">${bar(coverage)}</div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; color: #545454; margin-top: 10px;"><span>${coverageLine(coverage)}</span></div>
        </div>`;
}

export function globalsSection(ctx: RenderContext): string {
  if (ctx.metrics.globals === 0) return "";

  const cards = ctx.input.globals.types.map((type) => card(ctx, type)).join("");

  return `
  <div class="band">
    <div class="wrap">
      <h2 class="sec">Global sections</h2>
      <p class="lead">${escapeHtml(leadLine(ctx.input, ctx.metrics))}</p>

      <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 44px;">
${cards}
      </div>
    </div>
  </div>`;
}
