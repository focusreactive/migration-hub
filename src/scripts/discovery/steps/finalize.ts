import { readArtifact } from "#ir/artifact.ts";
import { discoveryBlocksArtifact, discoveryGlobalsArtifact } from "#ir/discovery.ts";
import { updateStep } from "#lib/manifest/index.ts";

import { DISCOVERY_FINALIZE_STEP_ID } from "../constants/ids.ts";

export async function runDiscoveryFinalize(projectPath: string): Promise<void> {
  const blocks = await readArtifact(projectPath, discoveryBlocksArtifact);
  const globals = await readArtifact(projectPath, discoveryGlobalsArtifact);

  await updateStep(projectPath, DISCOVERY_FINALIZE_STEP_ID, {
    status: "done",
    finishedAt: new Date().toISOString(),
  });

  console.log(JSON.stringify({ ok: true, blocks: blocks.types.length, globals: globals.types.length }));
}
