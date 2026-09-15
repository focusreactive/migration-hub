import { migrationSteps } from "#report/sections/migration-steps.ts";
import { clampSentences } from "#report/utils/clamp.ts";

import type { RenderContext } from "../render-context.ts";
import { escapeHtml } from "../utils/escape.ts";

const STEP_NAMES = [
  "Page discovery",
  "Asset extraction",
  "Schema &amp; content",
  "Section generation",
  "Project &amp; seeding",
];

function disc(index: number): string {
  return index === 0 ?
      '<div style="width: 36px; height: 36px; border-radius: 50%; background: #00e56d; color: #000; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 15px;">1</div>'
    : `<div style="width: 36px; height: 36px; border-radius: 50%; background: #0e0e0e; border: 1px solid #2c2c2c; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 15px;">${index + 1}</div>`;
}

function step(index: number, name: string, description: string): string {
  return `
          <div>
            ${disc(index)}
            <h3 class="sub" style="margin-top: 20px; font-size: 15px;">${name}</h3>
            <p class="body" style="font-size: 13px; margin-top: 8px;">${escapeHtml(clampSentences(description, 1))}</p>
          </div>`;
}

export function migrationStepsSection(ctx: RenderContext): string {
  const sentences = migrationSteps(ctx.metrics);
  const steps = sentences.map(([, sentence], index) => step(index, STEP_NAMES[index] ?? "", sentence)).join("");

  return `
  <div class="band">
    <div class="wrap">
      <h2 class="sec">How the migration runs</h2>

      <div style="position: relative; margin-top: 48px;">
        <div style="position: absolute; top: 18px; left: 18px; right: calc(${100 / sentences.length}% - 34px); height: 1px; background: #1e1e1e;"></div>
        <div style="display: grid; grid-template-columns: repeat(${sentences.length}, minmax(0, 1fr)); gap: 20px; position: relative;">${steps}
        </div>
      </div>
    </div>
  </div>`;
}
