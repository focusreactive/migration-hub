import { join } from "node:path";

import { ASSESSMENT_DIR } from "#ir/artifact.ts";

const ANCHORS_STEP_DIR = join(ASSESSMENT_DIR, "steps", "crops", "anchors");

export function anchorsResponseRelativePath(routeKey: string): string {
  return join(ANCHORS_STEP_DIR, `${routeKey}.response.json`);
}
