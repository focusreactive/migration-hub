import { z } from "zod";

import type { AcceptError } from "#discovery/types.ts";
import { readResponse } from "#discovery/utils/read-response.ts";
import { reportAcceptErrors } from "#discovery/utils/report-accept-errors.ts";
import { readArtifact, writeArtifact } from "#ir/artifact.ts";
import { formsArtifact, type FormRecord } from "#ir/forms.ts";
import { updateStep } from "#lib/manifest/index.ts";
import { distinctForms, formSignature, type DistinctForm } from "#report/analysis/distinct-forms.ts";

import {
  FORMS_NAMES_ACCEPT_STEP_ID,
  FORMS_NAMES_JUDGE_STEP_ID,
  FORMS_NAMES_SUBJECT_STEP_ID,
} from "../../constants/ids.ts";
import { namesResponseRelativePath } from "../../constants/paths.ts";
import { namesResponseSchema } from "../../schemas/names-response.ts";

import { validateNamesResponse } from "./utils/validate-names-response.ts";

// `formSignature` requires a FormRecord's shape, but a distinct group has no single `route`
// (it merges the routes the form repeats on). Its identity for signature purposes never
// includes `route`, so any placeholder value here produces the correct signature.
function groupSignature(group: DistinctForm): string {
  return formSignature({
    route: group.routes[0] ?? "",
    name: group.name,
    action: group.action,
    method: group.method,
    fieldCount: group.fieldCount,
    fields: group.fields,
  });
}

export async function runFormNamesAccept(projectPath: string): Promise<void> {
  const raw = await readResponse(projectPath, namesResponseRelativePath());

  const parsed = namesResponseSchema.safeParse(raw);
  if (!parsed.success) {
    reportAcceptErrors(schemaErrors(parsed.error.issues));
    return;
  }

  const forms = await readArtifact(projectPath, formsArtifact);
  const distinct = distinctForms(forms.forms);

  const errors = validateNamesResponse({ response: parsed.data, forms: distinct });
  if (errors.length > 0) {
    reportAcceptErrors(errors);
    return;
  }

  const labelsBySignature = new Map<string, { label: string; fields: Map<number, string> }>();
  for (const answer of parsed.data.forms) {
    const group = distinct[answer.index];
    if (group === undefined) continue;
    labelsBySignature.set(groupSignature(group), {
      label: answer.label,
      fields: new Map(answer.fields.map((field) => [field.index, field.label])),
    });
  }

  const labelled: FormRecord[] = forms.forms.map((form) => {
    const answer = labelsBySignature.get(formSignature(form));
    if (answer === undefined) return form;

    return {
      ...form,
      label: answer.label,
      fields: form.fields.map((field, index) => {
        const label = answer.fields.get(index);
        return label === undefined ? field : { ...field, label };
      }),
    };
  });

  await writeArtifact(projectPath, formsArtifact, { forms: labelled });

  const finishedAt = new Date().toISOString();
  for (const stepId of [FORMS_NAMES_SUBJECT_STEP_ID, FORMS_NAMES_JUDGE_STEP_ID, FORMS_NAMES_ACCEPT_STEP_ID]) {
    await updateStep(projectPath, stepId, { status: "done", finishedAt });
  }

  console.log(JSON.stringify({ ok: true, step: FORMS_NAMES_ACCEPT_STEP_ID, forms: parsed.data.forms.length }));
}

function schemaErrors(issues: z.core.$ZodIssue[]): AcceptError[] {
  return issues.map((issue) => ({
    code: "SCHEMA",
    where: issue.path.join(".") || "(root)",
    detail: issue.message,
    fix: "Make the response match the schema printed by the schema step.",
  }));
}
