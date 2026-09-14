import { existsSync } from "node:fs";

import { artifactPath } from "#ir/artifact.ts";
import { cropAnchorsShardArtifactFor } from "#ir/crops.ts";
import { routeDir } from "#lib/route-dir.ts";

export function routesMissingAnchors(projectPath: string, routes: string[]): string[] {
  return routes.filter((route) => !existsSync(artifactPath(projectPath, cropAnchorsShardArtifactFor(routeDir(route)))));
}
