import { join } from "node:path";

import { ASSESSMENT_DIR } from "#ir/artifact.ts";

const SECTIONS_STEP_DIR = join(ASSESSMENT_DIR, "steps", "discovery", "sections");
const DEDUP_STEP_DIR = join(ASSESSMENT_DIR, "steps", "discovery", "dedup");

export function sectionsResponseRelativePath(routeKey: string): string {
  return join(SECTIONS_STEP_DIR, `${routeKey}.response.json`);
}

export function dedupResponseRelativePath(): string {
  return join(DEDUP_STEP_DIR, "response.json");
}
