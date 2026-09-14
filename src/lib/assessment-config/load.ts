import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { assessmentConfigSchema, type AssessmentConfig } from "./schema.ts";
import { toolRootDir } from "./tool-root-dir.ts";

const CONFIG_FILE_NAME = "assessment.config.json";

export function loadAssessmentConfig(rootDir: string = toolRootDir()): AssessmentConfig {
  const configPath = join(rootDir, CONFIG_FILE_NAME);
  if (!existsSync(configPath)) {
    throw new Error(`${CONFIG_FILE_NAME} not found at ${configPath}.`);
  }
  const raw: unknown = JSON.parse(readFileSync(configPath, "utf8"));
  return assessmentConfigSchema.parse(raw);
}
