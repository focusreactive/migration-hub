import { join } from "node:path";

import { ASSESSMENT_DIR } from "#ir/artifact.ts";

const NARRATIVE_STEP_DIR = join(ASSESSMENT_DIR, "steps", "report", "narrative");

export function narrativeResponseRelativePath(): string {
  return join(NARRATIVE_STEP_DIR, "response.json");
}
