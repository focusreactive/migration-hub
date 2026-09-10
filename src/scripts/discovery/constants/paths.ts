import { join } from "node:path";

import { ESTIMATE_DIR } from "#ir/artifact.ts";

const SECTIONS_STEP_DIR = join(ESTIMATE_DIR, "steps", "discovery", "sections");

export function sectionsResponseRelativePath(routeKey: string): string {
  return join(SECTIONS_STEP_DIR, `${routeKey}.response.json`);
}
