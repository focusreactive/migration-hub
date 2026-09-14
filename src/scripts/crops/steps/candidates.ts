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

// A one-line summary of the per-route candidate counts scanned this run. A route that
// collapses to a single wrapper element (see the pinned-descent defect this catches) drops
// `min` toward 1 without needing to open a shard by hand; `median` and `total` show whether
// that is one bad route or every route.
function candidateCountStats(counts: number[]): { min: number; median: number; total: number } {
  if (counts.length === 0) return { min: 0, median: 0, total: 0 };

  const sorted = [...counts].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 1 ? (sorted[mid] ?? 0) : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;

  return {
    min: sorted[0] ?? 0,
    median,
    total: counts.reduce((sum, count) => sum + count, 0),
  };
}

export async function runCropCandidates(projectPath: string, force: boolean): Promise<void> {
  const runConfig = await loadRunConfig(projectPath);
  const pages = await readArtifact(projectPath, pagesArtifact);
  const routes = captureRoutes(pages);
  const origin = new URL(runConfig.sourceUrl).origin;

  const manifest = await readManifest(projectPath);
  const wasSkipped = manifest.steps[CROPS_CANDIDATES_STEP_ID]?.status === "done" && !force;

  const driver = createCropDriver();
  try {
    const counts = await withStep(
      projectPath,
      CROPS_CANDIDATES_STEP_ID,
      async () => {
        const perRoute: number[] = [];
        for (const route of routes) {
          const def = cropCandidatesShardArtifactFor(routeDir(route));
          if (!force && existsSync(artifactPath(projectPath, def))) continue;

          const candidates = await driver.candidates(new URL(route, origin).toString());
          await writeArtifact(projectPath, def, {
            route,
            viewportWidth: CROP_VIEWPORT.width,
            candidates,
          });
          perRoute.push(candidates.length);
        }
        return perRoute;
      },
      { force },
    );

    console.log(
      JSON.stringify({
        step: CROPS_CANDIDATES_STEP_ID,
        status: wasSkipped ? "skipped" : "done",
        routes: routes.length,
        scanned: wasSkipped ? 0 : (counts?.length ?? 0),
        candidates: candidateCountStats(wasSkipped ? [] : (counts ?? [])),
      }),
    );
  } finally {
    await driver.close();
  }
}
