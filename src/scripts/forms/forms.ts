import { artifactPath, readArtifact, writeArtifact } from "#ir/artifact.ts";
import { formsArtifact, type FormRecord, type FormsData } from "#ir/forms.ts";
import { pagesArtifact } from "#ir/pages.ts";
import { readManifest, recordArtifact, withStep } from "#lib/manifest/index.ts";
import { openMirrorStore, readOnlyClient } from "#lib/mirror-store/index.ts";
import { pageMirrorPathForRoute } from "#lib/mirror-store/paths.ts";
import type { MirrorEntry, MirrorStore } from "#lib/mirror-store/types.ts";

import { FORMS_STEP_ID } from "./constants/ids.ts";
import { scanForms } from "./scan-forms.ts";

function findPageEntry(store: MirrorStore, route: string): MirrorEntry | undefined {
  const relativePath = pageMirrorPathForRoute(route);

  return store.entries().find((entry) => entry.paths.raw === relativePath);
}

export async function runForms(projectPath: string, force: boolean): Promise<void> {
  const store = await openMirrorStore(projectPath, readOnlyClient());

  const manifest = await readManifest(projectPath);
  const wasSkipped = manifest.steps[FORMS_STEP_ID]?.status === "done" && !force;

  const computed = await withStep(
    projectPath,
    FORMS_STEP_ID,
    async () => {
      const pages = await readArtifact(projectPath, pagesArtifact);

      const forms: FormRecord[] = [];
      for (const page of pages.pages) {
        const entry = findPageEntry(store, page.route);
        if (entry === undefined) continue;

        const html = (await store.readBody(entry)).toString("utf8");
        forms.push(...scanForms(html, page.route));
      }

      const data: FormsData = { forms };
      await writeArtifact(projectPath, formsArtifact, data);
      await recordArtifact(projectPath, FORMS_STEP_ID, "forms", artifactPath(projectPath, formsArtifact));

      return data;
    },
    { force },
  );

  const data: FormsData = wasSkipped ? await readArtifact(projectPath, formsArtifact) : (computed as FormsData);

  console.log(
    JSON.stringify({
      step: FORMS_STEP_ID,
      status: wasSkipped ? "skipped" : "done",
      forms: data.forms.length,
    }),
  );
}
