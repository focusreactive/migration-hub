import type { FormField, FormRecord } from "#ir/forms.ts";
import { loadHtml } from "#lib/html.ts";

const FIELD_SELECTOR = "input, textarea, select";

export function scanForms(html: string, route: string): FormRecord[] {
  const $ = loadHtml(html);
  const records: FormRecord[] = [];

  $("form").each((_, element) => {
    const form = $(element);
    const fields: FormField[] = [];

    form.find(FIELD_SELECTOR).each((__, node) => {
      const field = $(node);
      const type = field.attr("type") ?? (node as { tagName?: string }).tagName ?? "text";
      if (type === "submit" || type === "button") return;

      fields.push({
        name: field.attr("name") ?? "",
        type,
        required: field.attr("required") !== undefined,
      });
    });

    const action = form.attr("action");
    records.push({
      route,
      name: form.attr("name") ?? form.attr("data-name") ?? null,
      action: action === undefined || action === "" ? null : action,
      method: (form.attr("method") ?? "get").toLowerCase(),
      fieldCount: fields.length,
      fields,
    });
  });

  return records;
}
