import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

import { readArtifact } from "#ir/artifact.ts";
import { cropCandidatesShardArtifactFor } from "#ir/crops.ts";
import { sectionsShardArtifactFor } from "#ir/discovery.ts";
import { pagesArtifact } from "#ir/pages.ts";
import { routeDir } from "#lib/route-dir.ts";
import { stitchPngPath } from "#stitch/stitch.ts";
import { captureRoutes } from "#stitch/utils/capture-routes.ts";

import { CROPS_ANCHORS_SUBJECT_STEP_ID } from "../../constants/ids.ts";
import { anchorsResponseRelativePath } from "../../constants/paths.ts";
import { routesMissingAnchors } from "../../utils/routes-missing-anchors.ts";

export async function runAnchorsSubject(projectPath: string, route: string | undefined): Promise<void> {
  const pages = await readArtifact(projectPath, pagesArtifact);
  const routes = captureRoutes(pages);

  if (route === undefined) {
    const remaining = routesMissingAnchors(projectPath, routes);
    console.log(JSON.stringify({ step: CROPS_ANCHORS_SUBJECT_STEP_ID, remaining }));
    return;
  }

  const routeKey = routeDir(route);
  const shard = await readArtifact(projectPath, sectionsShardArtifactFor(routeKey));
  const candidatesShard = await readArtifact(projectPath, cropCandidatesShardArtifactFor(routeKey));

  const sections = [
    ...shard.globals.map((section) => ({ ...section, kind: "global" as const })),
    ...shard.blocks.map((section) => ({ ...section, kind: "block" as const })),
  ].sort((a, b) => a.order - b.order);

  const responsePath = join(projectPath, anchorsResponseRelativePath(routeKey));
  await mkdir(dirname(responsePath), { recursive: true });

  console.log(
    JSON.stringify({
      route,
      stitchPngPath: stitchPngPath(projectPath, route),
      viewportWidth: candidatesShard.viewportWidth,
      sections,
      candidates: candidatesShard.candidates,
      responsePath,
    }),
  );
}
