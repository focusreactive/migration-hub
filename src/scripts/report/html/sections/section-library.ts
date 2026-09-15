import type { DiscoveryContentKind } from "#ir/discovery.ts";
import type { PagesData } from "#ir/pages.ts";
import { KIND_LABEL } from "#report/constants/labels.ts";
import { breakdown, kindsLabel } from "#report/sections/section-library.ts";
import { clampChars, clampSentences } from "#report/utils/clamp.ts";
import { countLabel, countWord } from "#report/utils/count.ts";
import { memberPageLabels } from "#report/utils/member-pages.ts";

import type { RenderContext } from "../render-context.ts";
import { escapeAttr, escapeHtml } from "../utils/escape.ts";
import { summaryForType } from "../utils/section-index.ts";
import { term } from "../utils/term.ts";

interface LibraryCard {
  id: string;
  name: string;
  instanceCount: number;
  members: { route: string }[];
  kinds: DiscoveryContentKind[];
}

function sortedCards(ctx: RenderContext): LibraryCard[] {
  return [...ctx.input.blocks.types].sort((a, b) => {
    if (a.instanceCount !== b.instanceCount) return b.instanceCount - a.instanceCount;
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  });
}

function lead(ctx: RenderContext): string {
  const { metrics } = ctx;
  const isSingle = metrics.uniqueLayoutPages === 1;
  const pagesLabel = isSingle ? "unique layout page" : "unique layout pages";
  const verb = isSingle ? "is" : "are";
  const sectionTypesLabel = countLabel(metrics.sectionTypes, "distinct section type", "distinct section types");
  const instancesLabel = metrics.sectionInstances === 1 ? "once" : `${metrics.sectionInstances} times`;

  return (
    `The ${countWord(metrics.uniqueLayoutPages)} ${term("uniqueLayoutPage", pagesLabel)} ${verb} built from `
    + `${sectionTypesLabel} used ${instancesLabel} in total: ${breakdown(metrics)}.`
  );
}

function counter(value: number, label: string, valueStyle: string): string {
  return (
    `<div><div class="num" style="font-size: 28px;${valueStyle}">${value}</div>`
    + `<div style="font-size: 12.5px; color: #7b7b7b; margin-top: 4px;">${label}</div></div>`
  );
}

function bar(card: LibraryCard, max: number): string {
  const height = Math.max(14, Math.round((card.instanceCount / max) * 118));
  const color = card.instanceCount > 1 ? "#00e56d" : "#262626";
  const title = escapeAttr(countLabel(card.instanceCount, "instance", "instances"));

  return `<span style="width: 16px; height: ${height}px; border-radius: 3px 3px 0 0; background: ${color};" title="${title}"></span>`;
}

export function memberPagesForCard(pages: PagesData, members: { route: string }[]): string {
  return memberPageLabels(pages, members)
    .map((member) => member.label)
    .join(" · ");
}

function dataKind(card: LibraryCard): string {
  return kindsLabel(card.kinds);
}

function dataTags(card: LibraryCard): string {
  const tags: string[] = [card.instanceCount > 1 ? "reused" : "once"];

  if (card.kinds.length > 1) tags.push("dual");
  else if (card.kinds.length === 1 && card.kinds[0] === "collectionSection") tags.push("cms");

  return tags.join(" ");
}

function kindChips(card: LibraryCard): string {
  const words = card.kinds.map((kind) => KIND_LABEL[kind]);

  return words
    .map(
      (word) => `<span class="chip" style="height: 22px; font-size: 11px; padding: 0 9px;">${escapeHtml(word)}</span>`,
    )
    .join("");
}

function instanceCountChip(count: number): string {
  return `<span class="chip" style="height: 22px; font-size: 11px; padding: 0 9px;">${count} instance${count === 1 ? "" : "s"}</span>`;
}

function cardSummary(ctx: RenderContext, id: string): string {
  const raw =
    summaryForType({ typeId: id, blocks: ctx.input.blocks, globals: ctx.input.globals, shards: ctx.input.shards })
    ?? "";
  return clampChars(clampSentences(raw, 1), 160);
}

function card(ctx: RenderContext, entry: LibraryCard): string {
  const name = escapeAttr(entry.name);
  const nameHtml = escapeHtml(entry.name);
  const kind = escapeAttr(dataKind(entry));
  const tags = escapeAttr(dataTags(entry));
  const pages = escapeAttr(memberPagesForCard(ctx.input.pages, entry.members));
  const summary = escapeAttr(cardSummary(ctx, entry.id));
  const shotBox = ctx.shots.box(entry.id, entry.name, {
    style: "aspect-ratio: 16 / 9; border-bottom: 1px solid #1e1e1e;",
  });

  return `
        <div class="card seccard" role="button" tabindex="0" data-name="${name}" data-count="${entry.instanceCount}" data-kind="${kind}" data-tags="${tags}" data-shot="${escapeAttr(entry.id)}" data-pages="${pages}" data-summary="${summary}" style="overflow: hidden;">
          ${shotBox}
          <div style="padding: 18px 20px 20px;">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;"><h3 class="sub" style="font-size: 15px;">${nameHtml}</h3></div>
            <div style="display: flex; gap: 6px; margin-top: 14px; flex-wrap: wrap;">${kindChips(entry)}${instanceCountChip(entry.instanceCount)}</div>
          </div>
        </div>`;
}

export function sectionLibrarySection(ctx: RenderContext): string {
  if (ctx.metrics.sectionTypes === 0) return "";

  const { metrics } = ctx;
  const cards = sortedCards(ctx);
  const max = Math.max(...cards.map((entry) => entry.instanceCount));
  const bars = cards.map((entry) => bar(entry, max)).join("");
  const cardsHtml = cards.map((entry) => card(ctx, entry)).join("");
  const showAllLabel = `Show all ${metrics.sectionTypes} section types`;

  return `
  <div class="band">
    <div class="wrap">
      <h2 class="sec">Section library</h2>
      <p class="lead">${lead(ctx)}</p>

      <div class="card" style="margin-top: 44px; padding: 32px 34px;">
        <div style="display: flex; align-items: flex-end; justify-content: space-between;">
          <div>
            <h3 class="sub">Instances per type, most-used first</h3>
            <p class="body" style="font-size: 13.5px; margin-top: 8px;">Green bars are reused types. Grey bars are the long tail.</p>
          </div>
          <div style="display: flex; gap: 28px; text-align: right;">
            ${counter(metrics.reusedSectionTypes, "reused", " color: #00e56d;")}
            ${counter(metrics.singleUseSectionTypes, "used once", "")}
            ${counter(metrics.dualSourceSectionTypes, "dual-source", "")}
          </div>
        </div>
        <div style="display: flex; align-items: flex-end; gap: 5px; height: 130px; margin-top: 30px; border-bottom: 1px solid #1e1e1e; padding-bottom: 1px;">${bars}</div>
      </div>

      <div style="display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 40px; flex-wrap: wrap;">
        <div style="display: flex; gap: 8px; flex-wrap: wrap;" id="secFilters">
          <button type="button" class="chip chip-btn chip-on" data-filter="all" data-total="${metrics.sectionTypes}" aria-pressed="true">All ${metrics.sectionTypes}</button>
          <button type="button" class="chip chip-btn" data-filter="reused" data-total="${metrics.reusedSectionTypes}" aria-pressed="false">Reused ${metrics.reusedSectionTypes}</button>
          <button type="button" class="chip chip-btn" data-filter="once" data-total="${metrics.singleUseSectionTypes}" aria-pressed="false">Used once ${metrics.singleUseSectionTypes}</button>
          <button type="button" class="chip chip-btn" data-filter="dual" data-total="${metrics.dualSourceSectionTypes}" aria-pressed="false">Dual-source ${metrics.dualSourceSectionTypes}</button>
          <button type="button" class="chip chip-btn" data-filter="cms" data-total="${metrics.collectionOnlySectionTypes}" aria-pressed="false">CMS only ${metrics.collectionOnlySectionTypes}</button>
        </div>
        <div style="display: flex; align-items: center; gap: 14px; flex-wrap: wrap;">
          <label class="searchbox">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#545454" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.5-3.5"></path></svg>
            <input id="secSearch" type="text" placeholder="Search sections" aria-label="Search sections" autocomplete="off" />
          </label>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-top: 22px;" id="secGrid">
${cardsHtml}
        <div id="secEmpty" hidden style="grid-column: 1 / -1; padding: 40px 2px; color: #545454; font-size: 14px;">No section type matches this filter.</div>
      </div>
      <div style="display: flex; justify-content: center; margin-top: 20px;"><button type="button" id="secToggle" class="chip chip-btn" style="height: 34px; padding: 0 18px; font-size: 13px;" data-label-collapsed="${escapeAttr(showAllLabel)}" data-label-expanded="Show fewer">${escapeHtml(showAllLabel)}</button></div>
    </div>
  </div>`;
}
