// Transcribed from docs/design/report.design.html:673-696 (the "Migrate this site
// yourself" band).
import { TOOLS_BY_SOURCE, type ToolLink } from "#report/constants/tools.ts";

import type { RenderContext } from "../render-context.ts";
import { ICON_ARROW, ICON_GITHUB } from "../constants/svg.ts";
import { escapeAttr, escapeHtml } from "../utils/escape.ts";

function repoCard(tool: ToolLink, icon: string): string {
  return `
        <a href="${escapeAttr(tool.url)}" class="card repocard" style="padding: 28px 30px; display: flex; align-items: center; justify-content: space-between; gap: 20px; color: #fff;">
          <div>
            <div style="font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #7b7b7b;">Target &middot; ${escapeHtml(tool.target)}</div>
            <div class="mono" style="font-size: 15px; margin-top: 10px; color: #00e56d;">${escapeHtml(tool.repo)}</div>
          </div>
          ${icon}
        </a>`;
}

export function toolsSection(ctx: RenderContext): string {
  const tools = TOOLS_BY_SOURCE[ctx.input.verdict];
  const icons = [ICON_GITHUB, ICON_ARROW];
  const cards = tools.map((tool, index) => repoCard(tool, icons[index] ?? ICON_GITHUB)).join("");

  return `
  <div class="band" style="background: #050505;">
    <div class="wrap">
      <h2 class="sec">Migrate this site yourself</h2>
      <p class="lead">The analysis above was produced by our open pipeline, and the migration itself has open tooling too. If you want to see the shape of the output before talking to anyone:</p>

      <style>.repocard { transition: border-color 0.15s ease; } .repocard:hover { border-color: #00e56d; } .repocard:hover svg { stroke: #00e56d; } .repocard svg { transition: stroke 0.15s ease; }</style>
      <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 44px;">${cards}
      </div>
    </div>
  </div>`;
}
