import { existsSync } from "node:fs";

import { artifactPath, readArtifact, writeArtifact } from "#ir/artifact.ts";
import {
  cropHeroPath,
  cropHeroRelativePath,
  cropIndexArtifact,
  cropShotPath,
  cropShotRelativePath,
  type CropHero,
  type CropMiss,
  type CropShot,
} from "#ir/crops.ts";
import {
  discoveryBlocksArtifact,
  discoveryGlobalsArtifact,
  sectionsShardArtifactFor,
  type Section,
} from "#ir/discovery.ts";
import { writeFileAtomic } from "#lib/fs.ts";
import { readManifest, withStep } from "#lib/manifest/index.ts";
import { routeDir } from "#lib/route-dir.ts";
import { loadRunConfig } from "#run-config/load.ts";

import { CROPS_CAPTURE_STEP_ID } from "../constants/ids.ts";
import { createCropDriver } from "../create-playwright-driver.ts";
import type { CropTarget } from "../types.ts";
import { planCaptures } from "../utils/crop-index.ts";
import { cropTargets, groupTargetsByRoute } from "../utils/crop-targets.ts";

async function readSections(projectPath: string, routeKey: string): Promise<Section[] | undefined> {
  const def = sectionsShardArtifactFor(routeKey);
  if (!existsSync(artifactPath(projectPath, def))) return undefined;
  const shard = await readArtifact(projectPath, def);
  return [...shard.globals, ...shard.blocks];
}

export async function runCropCapture(projectPath: string, force: boolean): Promise<void> {
  const runConfig = await loadRunConfig(projectPath);
  const origin = new URL(runConfig.sourceUrl).origin;

  const [blocks, globals] = await Promise.all([
    readArtifact(projectPath, discoveryBlocksArtifact),
    readArtifact(projectPath, discoveryGlobalsArtifact),
  ]);

  const grouped = groupTargetsByRoute(cropTargets(blocks, globals));

  const manifest = await readManifest(projectPath);
  const wasSkipped = manifest.steps[CROPS_CAPTURE_STEP_ID]?.status === "done" && !force;

  const driver = createCropDriver();
  try {
    const result = await withStep(
      projectPath,
      CROPS_CAPTURE_STEP_ID,
      async () => {
        const shots: CropShot[] = [];
        const missing: CropMiss[] = [];

        for (const [route, targets] of grouped) {
          const routeKey = routeDir(route);
          const sections = await readSections(projectPath, routeKey);

          const plan = planCaptures({ targets, sections, route });
          missing.push(...plan.missing);
          if (plan.requests.length === 0) continue;

          const byTypeId = new Map<string, CropTarget>(targets.map((target) => [target.typeId, target]));
          const outcomes = await driver.capture(new URL(route, origin).toString(), plan.requests);

          for (const outcome of outcomes) {
            const target = byTypeId.get(outcome.typeId);
            if (target === undefined) continue;

            if (!outcome.ok) {
              missing.push({ typeId: target.typeId, route, order: target.order, reason: outcome.reason });
              continue;
            }

            await writeFileAtomic(cropShotPath(projectPath, target.typeId), outcome.jpeg);
            shots.push({
              typeId: target.typeId,
              route,
              order: target.order,
              relativePath: cropShotRelativePath(target.typeId),
              width: outcome.width,
              height: outcome.height,
            });
          }
        }

        const heroShot = await driver.viewport(new URL("/", origin).toString());
        let hero: CropHero | undefined;
        if (heroShot !== undefined) {
          await writeFileAtomic(cropHeroPath(projectPath), heroShot.jpeg);
          hero = { relativePath: cropHeroRelativePath(), width: heroShot.width, height: heroShot.height };
        }

        await writeArtifact(projectPath, cropIndexArtifact, { shots, missing, ...(hero === undefined ? {} : { hero }) });
        return { shots: shots.length, missing: missing.length, hero: hero !== undefined };
      },
      { force },
    );

    console.log(
      JSON.stringify({
        step: CROPS_CAPTURE_STEP_ID,
        status: wasSkipped ? "skipped" : "done",
        targets: [...grouped.values()].reduce((total, targets) => total + targets.length, 0),
        shots: result?.shots ?? 0,
        missing: result?.missing ?? 0,
        hero: result?.hero ?? false,
      }),
    );
  } finally {
    await driver.close();
  }
}
