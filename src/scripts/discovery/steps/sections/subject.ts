import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

import { readArtifact } from "#ir/artifact.ts";
import { pagesArtifact } from "#ir/pages.ts";
import { routeDir } from "#lib/route-dir.ts";
import { stitchPngPath } from "#stitch/stitch.ts";
import { captureRoutes } from "#stitch/utils/capture-routes.ts";

import { DISCOVERY_SECTIONS_SUBJECT_STEP_ID } from "../../constants/ids.ts";
import { sectionsResponseRelativePath } from "../../constants/paths.ts";
import { routesMissingShard } from "../../utils/routes-missing-shard.ts";

export async function runSectionsSubject(projectPath: string, route: string | undefined): Promise<void> {
  const pages = await readArtifact(projectPath, pagesArtifact);
  const routes = captureRoutes(pages);

  if (route === undefined) {
    const remaining = routesMissingShard(projectPath, routes);
    console.log(JSON.stringify({ step: DISCOVERY_SECTIONS_SUBJECT_STEP_ID, remaining }));
    return;
  }

  const responsePath = join(projectPath, sectionsResponseRelativePath(routeDir(route)));
  await mkdir(dirname(responsePath), { recursive: true });

  console.log(
    JSON.stringify({
      route,
      stitchPngPath: stitchPngPath(projectPath, route),
      responsePath,
    }),
  );
}
