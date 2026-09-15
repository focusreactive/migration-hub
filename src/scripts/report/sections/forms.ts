import type { FormField } from "#ir/forms.ts";

import { distinctForms, fieldDisplayName, formDisplayName, type DistinctForm } from "../analysis/distinct-forms.ts";
import type { ReportMetrics } from "../analysis/metrics.ts";
import type { ReportInput } from "../types.ts";
import { sentenceCountLabel } from "../utils/count.ts";
import { table } from "../utils/table.ts";

function fieldNames(fields: FormField[]): string[] {
  return fields.map((field) => fieldDisplayName(field)).filter((name) => name !== "");
}

function fieldsCell(form: DistinctForm): string {
  const named = fieldNames(form.fields);
  if (named.length === 0) return String(form.fieldCount);

  const [field] = form.fields;
  if (form.fields.length === 1 && field !== undefined) {
    return `${form.fieldCount} (${fieldDisplayName(field)}${field.required ? ", required" : ""})`;
  }

  const allRequired = form.fields.every((field) => field.required);
  return `${form.fieldCount} (${named.join(", ")}${allRequired ? " — all required" : ""})`;
}

export function formsLead(metrics: ReportMetrics): string {
  return (
    `${sentenceCountLabel(metrics.forms, "distinct form collects", "distinct forms collect")} input on this site, `
    + `listed below with the fields ${metrics.forms === 1 ? "it" : "each one"} submits.`
  );
}

export function formsSection(input: ReportInput, metrics: ReportMetrics): string {
  if (metrics.forms === 0) return ["## Forms", "", "No forms found."].join("\n");

  const forms = distinctForms(input.forms.forms);

  return [
    "## Forms",
    "",
    formsLead(metrics),
    "",
    table(
      ["Form", "Fields"],
      forms.map((form) => [formDisplayName(form), fieldsCell(form)]),
    ),
  ].join("\n");
}
