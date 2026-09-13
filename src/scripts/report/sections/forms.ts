import type { FormField } from "#ir/forms.ts";

import { distinctForms, type DistinctForm } from "../analysis/distinct-forms.ts";
import type { ReportMetrics } from "../analysis/metrics.ts";
import type { ReportInput } from "../types.ts";
import { countLabel } from "../utils/count.ts";
import { table } from "../utils/table.ts";

function namedFieldNames(fields: FormField[]): string[] {
  return fields.map((field) => field.name).filter((name) => name !== "");
}

function anonymousFormLabel(fields: FormField[]): string {
  const named = namedFieldNames(fields);
  return named.length === 0 ? "—" : named.join(", ");
}

function formLabel(form: DistinctForm): string {
  return form.name === null ? anonymousFormLabel(form.fields) : `\`${form.name}\``;
}

function fieldsCell(form: DistinctForm): string {
  const named = namedFieldNames(form.fields);
  if (named.length === 0) return String(form.fieldCount);

  const [field] = form.fields;
  if (form.fields.length === 1 && field !== undefined) {
    return `${form.fieldCount} (\`${field.name}\`${field.required ? ", required" : ""})`;
  }

  const names = named.join(", ");
  const allRequired = form.fields.every((field) => field.required);
  return `${form.fieldCount} (${names}${allRequired ? " — all required" : ""})`;
}

export function formsSection(input: ReportInput, metrics: ReportMetrics): string {
  if (metrics.forms === 0) return ["## Forms", "", "No forms found."].join("\n");

  const forms = distinctForms(input.forms.forms);

  return [
    "## Forms",
    "",
    `${countLabel(metrics.forms, "distinct form collects", "distinct forms collect")} input on this site, listed `
      + "below with the fields each one submits.",
    "",
    table(["Form", "Fields"], forms.map((form) => [formLabel(form), fieldsCell(form)])),
  ].join("\n");
}
