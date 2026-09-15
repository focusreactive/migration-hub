// Transcribed from docs/design/report.design.html:51-76 (the scope-at-a-glance band).
import { collectionNameFromRoutePattern } from "#report/utils/collection-name.ts";

import type { RenderContext } from "../render-context.ts";
import { escapeHtml } from "../utils/escape.ts";
import { term } from "../utils/term.ts";

interface StackSegmentStyle {
  background: string;
  color: string;
}

function stackSegmentStyle(index: number): StackSegmentStyle {
  switch (index % 3) {
    case 1:
      return { background: "#232323", color: "#fff" };
    case 2:
      return { background: "#1a1a1a", color: "#9c9c9c" };
    default:
      return { background: "#2c2c2c", color: "#fff" };
  }
}

function numStyle(value: number): string {
  return value === 0 ? "font-size: 40px; margin-top: 14px; color: #545454;" : "font-size: 40px; margin-top: 14px;";
}

function card(label: string, value: number): string {
  return `<div class="card" style="padding: 24px;"><div style="font-size: 12px; color: #7b7b7b; text-transform: uppercase; letter-spacing: 0.12em;">${label}</div><div class="num" style="${numStyle(value)}">${value}</div></div>`;
}

function collectionSegments(ctx: RenderContext): string {
  return ctx.input.pages.collections
    .map((collection, index) => {
      const style = stackSegmentStyle(index);
      const name = escapeHtml(collectionNameFromRoutePattern(collection.routePattern).toLowerCase());
      return `<div style="flex: ${collection.itemCount}; background: ${style.background}; display: flex; align-items: center; padding-left: 14px; color: ${style.color}; font-size: 13px; font-weight: 500;">${collection.itemCount} ${name}</div>`;
    })
    .join("");
}

export function scopeSection(ctx: RenderContext): string {
  const { metrics } = ctx;

  return `
  <div class="band" style="background: #050505;">
    <div class="wrap">
      <h2 class="sec">Scope at a glance</h2>

      <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-top: 44px;">
        ${card(term("page"), metrics.pages)}
        ${card(term("collection"), metrics.collections)}
        ${card(term("sectionType"), metrics.sectionTypes)}
        ${card(term("global"), metrics.globals)}
        ${card("Images", metrics.images)}
        ${card("Videos", metrics.videos)}
        ${card("Font families", metrics.fonts)}
        ${card("Forms", metrics.forms)}
      </div>

      <div class="card" style="margin-top: 16px; padding: 28px 30px;">
        <h3 class="sub">How the ${metrics.pages} pages break down</h3>
        <div style="display: flex; gap: 3px; margin-top: 20px; height: 34px; border-radius: 8px; overflow: hidden;">
          <div style="flex: ${metrics.pageBuilderPages}; background: #00e56d; display: flex; align-items: center; padding-left: 14px; color: #000; font-size: 13px; font-weight: 600;">${metrics.pageBuilderPages} page-builder</div>
          ${collectionSegments(ctx)}
        </div>
        <p class="body" style="margin-top: 22px; padding-top: 20px; border-top: 1px solid #171717; font-size: 14px;">${metrics.uniqueLayoutPages} ${term("uniqueLayoutPage")} to build</p>
      </div>
    </div>
  </div>`;
}
