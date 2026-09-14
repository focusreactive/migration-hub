import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ASSESSMENT_DIR } from "#ir/artifact.ts";

import { runConfigSchema, type RunConfig } from "./schema.ts";

export function runConfigPath(projectPath: string): string {
  return join(projectPath, ASSESSMENT_DIR, "run-config.json");
}

export async function loadRunConfig(projectPath: string): Promise<RunConfig> {
  const raw: unknown = JSON.parse(await readFile(runConfigPath(projectPath), "utf8"));
  return runConfigSchema.parse(raw);
}
