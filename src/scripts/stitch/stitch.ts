import { existsSync } from "node:fs";
import { join } from "node:path";

import { ESTIMATE_DIR, readArtifact } from "#ir/artifact.ts";
import { pagesArtifact } from "#ir/pages.ts";
import { loadEstimateConfig } from "#lib/estimate-config/index.ts";
import { writeFileAtomic } from "#lib/fs.ts";
import { readManifest, withStep } from "#lib/manifest/index.ts";
import { routeDir } from "#lib/route-dir.ts";
import { loadRunConfig } from "#run-config/load.ts";

import { STITCH_STEP_ID } from "./constants/ids.ts";
import { createPlaywrightDriver } from "./create-playwright-driver.ts";
import { staticRoutes } from "./utils/static-routes.ts";

export function stitchPngPath(projectPath: string, route: string): string {
  return join(projectPath, ESTIMATE_DIR, "artifacts", "stitch", routeDir(route), "desktop.png");
}

export async function runStitch(projectPath: string, force: boolean): Promise<void> {
  const runConfig = await loadRunConfig(projectPath);
  const config = loadEstimateConfig();
  const pages = await readArtifact(projectPath, pagesArtifact);
  const routes = staticRoutes(pages);
  const origin = new URL(runConfig.sourceUrl).origin;

  const manifest = await readManifest(projectPath);
  const wasSkipped = manifest.steps[STITCH_STEP_ID]?.status === "done" && !force;

  const driver = createPlaywrightDriver(config.stitch.viewport);
  try {
    const captured = await withStep(
      projectPath,
      STITCH_STEP_ID,
      async () => {
        let count = 0;
        for (const route of routes) {
          const pngPath = stitchPngPath(projectPath, route);
          if (!force && existsSync(pngPath)) continue;

          const png = await driver.render(new URL(route, origin).toString());
          await writeFileAtomic(pngPath, png);
          count++;
        }
        return count;
      },
      { force },
    );

    console.log(
      JSON.stringify({
        step: STITCH_STEP_ID,
        status: wasSkipped ? "skipped" : "done",
        routes: routes.length,
        captured: wasSkipped ? 0 : (captured ?? 0),
      }),
    );
  } finally {
    await driver.close();
  }
}
