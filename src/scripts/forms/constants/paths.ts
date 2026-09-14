import { join } from "node:path";

import { ASSESSMENT_DIR } from "#ir/artifact.ts";

const NAMES_STEP_DIR = join(ASSESSMENT_DIR, "steps", "forms", "names");

export function namesResponseRelativePath(): string {
  return join(NAMES_STEP_DIR, "response.json");
}
