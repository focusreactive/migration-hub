import { existsSync } from "node:fs";

import { artifactPath, readArtifact, writeArtifact } from "#ir/artifact.ts";
import { cropCandidatesShardArtifactFor } from "#ir/crops.ts";
import { pagesArtifact } from "#ir/pages.ts";
import { readManifest, withStep } from "#lib/manifest/index.ts";
import { routeDir } from "#lib/route-dir.ts";
import { loadRunConfig } from "#run-config/load.ts";
import { captureRoutes } from "#stitch/utils/capture-routes.ts";

import { CROP_VIEWPORT } from "../constants/capture.ts";
import { CROPS_CANDIDATES_STEP_ID } from "../constants/ids.ts";
import { createCropDriver } from "../create-playwright-driver.ts";

export async function runCropCandidates(projectPath: string, force: boolean): Promise<void> {
  const runConfig = await loadRunConfig(projectPath);
  const pages = await readArtifact(projectPath, pagesArtifact);
  const routes = captureRoutes(pages);
  const origin = new URL(runConfig.sourceUrl).origin;

  const manifest = await readManifest(projectPath);
  const wasSkipped = manifest.steps[CROPS_CANDIDATES_STEP_ID]?.status === "done" && !force;

  const driver = createCropDriver();
  try {
    const scanned = await withStep(
      projectPath,
      CROPS_CANDIDATES_STEP_ID,
      async () => {
        let count = 0;
        for (const route of routes) {
          const def = cropCandidatesShardArtifactFor(routeDir(route));
          if (!force && existsSync(artifactPath(projectPath, def))) continue;

          const candidates = await driver.candidates(new URL(route, origin).toString());
          await writeArtifact(projectPath, def, {
            route,
            viewportWidth: CROP_VIEWPORT.width,
            candidates,
          });
          count += 1;
        }
        return count;
      },
      { force },
    );

    console.log(
      JSON.stringify({
        step: CROPS_CANDIDATES_STEP_ID,
        status: wasSkipped ? "skipped" : "done",
        routes: routes.length,
        scanned: wasSkipped ? 0 : (scanned ?? 0),
      }),
    );
  } finally {
    await driver.close();
  }
}
