import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

import { readArtifact } from "#ir/artifact.ts";
import { sectionsShardArtifactFor } from "#ir/discovery.ts";
import { pagesArtifact } from "#ir/pages.ts";
import { routeDir } from "#lib/route-dir.ts";
import { staticRoutes } from "#stitch/utils/static-routes.ts";

import { dedupResponseRelativePath } from "../../constants/paths.ts";

import type { DedupInstance } from "./utils/fold-types.ts";

export async function readDedupInstances(projectPath: string): Promise<DedupInstance[]> {
  const pages = await readArtifact(projectPath, pagesArtifact);
  const routes = staticRoutes(pages);

  const instances: DedupInstance[] = [];
  for (const route of routes) {
    const shard = await readArtifact(projectPath, sectionsShardArtifactFor(routeDir(route)));

    for (const section of shard.globals) {
      instances.push({ kind: "global", route: shard.route, order: section.order, role: section.role, summary: section.summary });
    }
    for (const section of shard.blocks) {
      instances.push({ kind: "block", route: shard.route, order: section.order, role: section.role, summary: section.summary });
    }
  }

  return instances;
}

export async function runDedupSubject(projectPath: string): Promise<void> {
  const instances = await readDedupInstances(projectPath);
  const responsePath = join(projectPath, dedupResponseRelativePath());
  await mkdir(dirname(responsePath), { recursive: true });

  console.log(JSON.stringify({ instances, responsePath }));
}
