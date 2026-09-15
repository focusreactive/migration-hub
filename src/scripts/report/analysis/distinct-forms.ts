import type { FormField, FormRecord } from "#ir/forms.ts";

export interface DistinctForm {
  name: string | null;
  action: string | null;
  method: string;
  fieldCount: number;
  fields: FormField[];
  routes: string[];
}

export function formSignature(form: FormRecord): string {
  return JSON.stringify([form.name, form.action, form.method, form.fields]);
}

function compareForms(a: DistinctForm, b: DistinctForm): number {
  const aName = a.name ?? "";
  const bName = b.name ?? "";
  if (aName !== bName) return aName < bName ? -1 : 1;

  const aAction = a.action ?? "";
  const bAction = b.action ?? "";
  if (aAction !== bAction) return aAction < bAction ? -1 : 1;

  if (a.method !== b.method) return a.method < b.method ? -1 : 1;
  if (a.fieldCount !== b.fieldCount) return a.fieldCount - b.fieldCount;

  const aRoute = a.routes[0] ?? "";
  const bRoute = b.routes[0] ?? "";
  if (aRoute !== bRoute) return aRoute < bRoute ? -1 : 1;

  return 0;
}

export function distinctForms(forms: FormRecord[]): DistinctForm[] {
  const groups = new Map<string, DistinctForm>();

  for (const form of forms) {
    const signature = formSignature(form);
    const existing = groups.get(signature);
    if (existing === undefined) {
      groups.set(signature, {
        name: form.name,
        action: form.action,
        method: form.method,
        fieldCount: form.fieldCount,
        fields: form.fields,
        routes: [form.route],
      });
    } else {
      existing.routes.push(form.route);
    }
  }

  return [...groups.values()].map((group) => ({ ...group, routes: [...group.routes].sort() })).sort(compareForms);
}
