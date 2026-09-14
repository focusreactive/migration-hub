import { join } from "node:path";

import { readArtifact } from "#ir/artifact.ts";
import { fontFamiliesArtifact, mediaAssetsArtifact } from "#ir/assets.ts";
import { detectArtifact } from "#ir/detect.ts";
import { discoveryBlocksArtifact, discoveryGlobalsArtifact } from "#ir/discovery.ts";
import { formsArtifact } from "#ir/forms.ts";
import { narrativeArtifact, type NarrativeData } from "#ir/narrative.ts";
import { pagesArtifact } from "#ir/pages.ts";
import { writeFileAtomic } from "#lib/fs.ts";
import { readManifest, recordArtifact, withStep } from "#lib/manifest/index.ts";
import { loadRunConfig } from "#run-config/load.ts";

import { REPORT_STEP_ID } from "./constants/ids.ts";
import { renderReport, type ReportInput } from "./render-report.ts";

function reportPath(projectPath: string): string {
  return join(projectPath, "report.md");
}

async function readNarrative(projectPath: string): Promise<NarrativeData> {
  try {
    return await readArtifact(projectPath, narrativeArtifact);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;

    throw new Error(
      `The report needs ${narrativeArtifact.relativePath}, which has not been written yet. Run the narrative step first: --narrative-subject to get the subject, then --narrative-accept once the response is written.`,
      { cause: error },
    );
  }
}

export async function runReport(projectPath: string, force: boolean): Promise<void> {
  const runConfig = await loadRunConfig(projectPath);

  const manifest = await readManifest(projectPath);
  const wasSkipped = manifest.steps[REPORT_STEP_ID]?.status === "done" && !force;

  await withStep(
    projectPath,
    REPORT_STEP_ID,
    async () => {
      const detect = await readArtifact(projectPath, detectArtifact);
      if (detect.verdict !== "webflow" && detect.verdict !== "framer") {
        throw new Error(
          `The report can only be built for a recognised platform (webflow or framer); this project's detected platform is "${detect.verdict}".`,
        );
      }

      const [pages, media, fonts, forms, blocks, globals, narrative] = await Promise.all([
        readArtifact(projectPath, pagesArtifact),
        readArtifact(projectPath, mediaAssetsArtifact),
        readArtifact(projectPath, fontFamiliesArtifact),
        readArtifact(projectPath, formsArtifact),
        readArtifact(projectPath, discoveryBlocksArtifact),
        readArtifact(projectPath, discoveryGlobalsArtifact),
        readNarrative(projectPath),
      ]);

      const input: ReportInput = {
        sourceUrl: runConfig.sourceUrl,
        verdict: detect.verdict,
        pages,
        media,
        fonts,
        forms,
        blocks,
        globals,
        narrative,
      };

      const path = reportPath(projectPath);
      await writeFileAtomic(path, renderReport(input));
      await recordArtifact(projectPath, REPORT_STEP_ID, "report", path);
    },
    { force },
  );

  console.log(
    JSON.stringify({
      step: REPORT_STEP_ID,
      status: wasSkipped ? "skipped" : "done",
      reportPath: reportPath(projectPath),
    }),
  );
}
