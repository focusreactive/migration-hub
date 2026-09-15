// Transcribed from docs/design/report.design.html:619-635 (the risks & watch-outs band).
import type { RenderContext } from "../render-context.ts";
import { clampSentences } from "../utils/clamp.ts";
import { inlineMarkdown } from "../utils/inline-markdown.ts";

const PLAN_FOR_MARKER = "*Plan for:*";

// Risk titles are assembled entirely from a fixed vocabulary (platform names, counts,
// canned phrases) — never from scraped page content — and sit in text content, never
// an attribute, so quoting doesn't need escaping here. `&`/`<`/`>` still are, since a
// platform label or count could in principle collide with markup-significant characters.
function escapeTitle(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function body(risk: RenderContext["risks"][number]): string {
  const parts = risk.body.split(PLAN_FOR_MARKER);

  if (parts.length !== 2) return clampSentences(inlineMarkdown(risk.body), 2);

  const [before = "", after = ""] = parts;
  const beforeHtml = clampSentences(inlineMarkdown(before), 2).trimEnd();
  const afterHtml = clampSentences(inlineMarkdown(after), 1);

  return `${beforeHtml} <em>Plan for:</em>${afterHtml}`;
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
