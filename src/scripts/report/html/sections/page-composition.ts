import { clampChars } from "#report/utils/clamp.ts";
import type { RenderContext } from "../render-context.ts";
import { escapeAttr, escapeHtml } from "../utils/escape.ts";
import type { IndexedPage, IndexedSection } from "../utils/section-index.ts";
import { chunkStripRows, type StripRow } from "../utils/strip-rows.ts";
import { term } from "../utils/term.ts";

const PER_ROW = 7;

const GLOBAL_PILL_STYLE =
  "display: inline-flex; align-items: center; justify-content: center; height: 18px; padding: 0 7px; "
  + "border-radius: 100px; background: #00e56d; color: #000; font-size: 10px; font-weight: 600; vertical-align: 1px;";

const GLOBAL_BADGE =
  '<span style="position: absolute; top: 6px; left: 6px; z-index: 1; height: 18px; padding: 0 7px; '
  + "border-radius: 100px; background: #00e56d; color: #000; font-size: 10px; font-weight: 600; "
  + 'display: inline-flex; align-items: center;">G</span>';

function blockBadge(blockNumber: number): string {
  return (
    '<span style="position: absolute; top: 6px; left: 6px; z-index: 1; height: 18px; min-width: 18px; '
    + "padding: 0 5px; border-radius: 100px; background: rgba(0,0,0,0.72); color: #9c9c9c; font-size: 10px; "
    + `font-weight: 600; display: inline-flex; align-items: center; justify-content: center;">${blockNumber}</span>`
  );
}

interface Tile {
  section: IndexedSection;
  blockNumber: number | null;
}

function tilesForPage(page: IndexedPage): Tile[] {
  let counter = 0;

  return page.sections.map((section) => {
    if (section.isGlobal) return { section, blockNumber: null };
    counter += 1;
    return { section, blockNumber: counter };
  });
}

function lead(ctx: RenderContext): string {
  const { metrics } = ctx;

  return (
    `All ${metrics.uniqueLayoutPages} ${term("uniqueLayoutPage")}, top to bottom, as the sections each is built `
    + `from. Globals are marked <span style="${GLOBAL_PILL_STYLE}">G</span> &mdash; they are authored once and `
    + `reused everywhere.`
  );
}

function tileCell(ctx: RenderContext, tile: Tile | null): string {
  if (tile === null) return '<div style="flex: 1 1 0; min-width: 0;"></div>';

  const { section, blockNumber } = tile;
  const badge = section.isGlobal ? GLOBAL_BADGE : blockBadge(blockNumber ?? 0);
  const borderColor = section.isGlobal ? "#17311f" : "#1e1e1e";
  const shotBox = ctx.shots.box(section.typeId, section.name, {
    style: `position: relative; aspect-ratio: 2 / 1; border: 1px solid ${borderColor}; border-radius: 8px;`,
    badge,
  });
  const caption = escapeHtml(clampChars(section.name, 24));
  const fullName = escapeAttr(section.name);

  return (
    '<div style="flex: 1 1 0; min-width: 0;">'
    + `${shotBox}`
    + `<div style="font-size: 11px; color: #7b7b7b; margin-top: 7px; line-height: 1.3; min-height: 29px;" `
    + `title="${fullName}">${caption}</div></div>`
  );
}

function connectorCell(painted: boolean): string {
  const style = `flex: none; width: 22px; height: 1px; margin-top: 34px;${painted ? " background: #262626;" : ""}`;
  return `<div style="${style}"></div>`;
}

function rowHtml(ctx: RenderContext, row: StripRow<Tile>): string {
  const direction = row.reversed ? "row-reverse" : "row";
  const parts: string[] = [];

  row.cells.forEach((cell, index) => {
    parts.push(tileCell(ctx, cell));

    if (index < row.cells.length - 1) {
      const next = row.cells[index + 1] ?? null;
      const painted = cell !== null && next !== null;
      parts.push(connectorCell(painted));
    }
  });

  return `<div style="display: flex; flex-direction: ${direction}; align-items: flex-start;">${parts.join("")}</div>`;
}

function cardHtml(ctx: RenderContext, page: IndexedPage): string {
  const tiles = tilesForPage(page);
  const rows = chunkStripRows(tiles, PER_ROW);
  const rowsHtml = rows.map((row) => rowHtml(ctx, row)).join("");

  const header =
    '<div style="display: flex; align-items: baseline; gap: 12px; margin-bottom: 18px;">'
    + `<h3 class="sub">${escapeHtml(page.title)}</h3>`
    + `${ctx.linker.routeAnchor(page.route)}`
    + `<span style="margin-left: auto; font-size: 12.5px; color: #545454;">${page.sections.length} sections</span>`
    + "</div>";

  return (
    `<div class="card" style="padding: 22px 24px;">${header}`
    + `<div style="display: flex; flex-direction: column; gap: 20px;">${rowsHtml}</div></div>`
  );
}

export function pageCompositionSection(ctx: RenderContext): string {
  const { metrics, pagesIndex } = ctx;
  if (pagesIndex.length === 0) return "";

  const visible = pagesIndex.slice(0, 3).map((page) => cardHtml(ctx, page));
  const rest = pagesIndex.slice(3).map((page) => cardHtml(ctx, page));
  const showAllLabel = `Show all ${metrics.uniqueLayoutPages} layout pages`;

  return `
  <div class="band" style="background: #050505;">
    <div class="wrap">
      <h2 class="sec">Page composition</h2>
      <p class="lead">${lead(ctx)}</p>

      <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 44px;">
${visible.join("\n")}
        <div id="pageRest" style="display: none; flex-direction: column; gap: 12px;">
${rest.join("\n")}
        </div>
      </div>
      <div style="display: flex; justify-content: center; margin-top: 20px;"><button type="button" id="pageToggle" class="chip chip-btn" style="height: 34px; padding: 0 18px; font-size: 13px;" aria-expanded="false" aria-controls="pageRest">${escapeHtml(showAllLabel)}</button></div>
    </div>
  </div>`;
}
