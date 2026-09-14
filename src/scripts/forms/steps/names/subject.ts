import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

import { readArtifact } from "#ir/artifact.ts";
import { formsArtifact } from "#ir/forms.ts";
import { distinctForms } from "#report/analysis/distinct-forms.ts";

import { namesResponseRelativePath } from "../../constants/paths.ts";

export async function runFormNamesSubject(projectPath: string): Promise<void> {
  const forms = await readArtifact(projectPath, formsArtifact);
  const distinct = distinctForms(forms.forms);

  const responsePath = join(projectPath, namesResponseRelativePath());
  await mkdir(dirname(responsePath), { recursive: true });

  console.log(
    JSON.stringify({
      forms: distinct.map((form, index) => ({
        index,
        sourceName: form.name,
        action: form.action,
        method: form.method,
        routes: form.routes,
        fields: form.fields.map((field, fieldIndex) => ({
          index: fieldIndex,
          sourceName: field.name,
          type: field.type,
          required: field.required,
        })),
      })),
      responsePath,
    }),
  );
}
