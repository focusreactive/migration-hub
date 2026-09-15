import type { FormField } from "#ir/forms.ts";
import {
  distinctForms,
  fieldDisplayName,
  formDisplayName,
  type DistinctForm,
} from "#report/analysis/distinct-forms.ts";
import { formsLead } from "#report/sections/forms.ts";

import type { RenderContext } from "../render-context.ts";
import { escapeHtml } from "../utils/escape.ts";

function fieldRow(field: FormField): string {
  const dot =
    field.required ?
      '<span style="width: 5px; height: 5px; border-radius: 50%; background: #00e56d; flex: none;"></span>'
    : "";

  return `<div style="display: grid; grid-template-columns: minmax(0, 1fr) 84px; gap: 16px; align-items: center; padding: 11px 14px; background: #0a0a0a;"><span style="display: flex; align-items: center; gap: 8px; font-size: 13.5px; color: #e8e8e8;">${dot}${escapeHtml(fieldDisplayName(field))}</span><span class="mono" style="font-size: 11.5px; color: #545454; text-align: right;">${escapeHtml(field.type)}</span></div>`;
}

function requiredLegend(form: DistinctForm): string {
  if (!form.fields.some((field) => field.required)) return "";

  return `<div style="display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 11.5px; color: #545454;"><span style="width: 5px; height: 5px; border-radius: 50%; background: #00e56d;"></span>required</div>`;
}

function formCard(form: DistinctForm): string {
  const chip = `${form.fieldCount} ${form.fieldCount === 1 ? "field" : "fields"}`;
  const rows = form.fields.map((field) => fieldRow(field)).join("");

  return `<div class="card" style="padding: 26px 28px;"><div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;"><div><h3 class="sub" style="font-size: 17px;">${escapeHtml(formDisplayName(form))}</h3></div><span class="chip" style="height: 22px; font-size: 11px; padding: 0 9px;">${escapeHtml(chip)}</span></div><div style="margin-top: 20px; border: 1px solid #1a1a1a; border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; gap: 1px; background: #1a1a1a;"><div style="display: grid; grid-template-columns: minmax(0, 1fr) 84px; gap: 16px; align-items: center; padding: 9px 14px; background: #0b0b0b; font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: #545454;"><span>Field</span><span style="text-align: right;">Type</span></div>${rows}</div>${requiredLegend(form)}</div>`;
}

export function formsSection(ctx: RenderContext): string {
  if (ctx.metrics.forms === 0) return "";

  const cards = distinctForms(ctx.input.forms.forms)
    .map((form) => formCard(form))
    .join("");

  return `
  <div class="band" style="background: #050505;">
    <div class="wrap">
      <h2 class="sec">Forms</h2>
      <p class="lead">${escapeHtml(formsLead(ctx.metrics))}</p>

      <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 16px; align-items: start;">
${cards}
      </div>
    </div>
  </div>`;
}
