import { existsSync } from "node:fs";

import { artifactPath } from "#ir/artifact.ts";
import { sectionsShardArtifactFor } from "#ir/discovery.ts";
import { routeDir } from "#lib/route-dir.ts";

export function routesMissingShard(projectPath: string, routes: string[]): string[] {
  return routes.filter((route) => !existsSync(artifactPath(projectPath, sectionsShardArtifactFor(routeDir(route)))));
}
