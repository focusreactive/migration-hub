import { riskBody } from "#report/sections/risks.ts";

import type { RenderContext } from "../render-context.ts";
import { inlineMarkdown } from "../utils/inline-markdown.ts";

function escapeTitle(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function body(risk: RenderContext["risks"][number]): string {
  const { diagnosis, planFor } = riskBody(risk);
  if (planFor === undefined) return inlineMarkdown(diagnosis);

  return `${inlineMarkdown(diagnosis)} <em>Plan for:</em>${inlineMarkdown(planFor)}`;
}

function card(risk: RenderContext["risks"][number]): string {
  return `<div class="card" style="padding: 26px 28px;"><h3 class="sub" style="font-size: 16px;">${escapeTitle(risk.title)}</h3><p class="body" style="font-size: 13.5px; margin-top: 12px;">${body(risk)}</p></div>`;
}

export function risksSection(ctx: RenderContext): string {
  if (ctx.risks.length === 0) return "";

  const cards = ctx.risks.map((risk) => card(risk)).join("");

  return `
  <div class="band" style="background: #050505;">
    <div class="wrap">
      <h2 class="sec">Risks &amp; watch-outs</h2>
      <p class="lead">Each one fired from a rule over the counts above &mdash; none of them is a hunch.</p>

      <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 44px;">
${cards}
      </div>
    </div>
  </div>`;
}
