import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { estimateConfigSchema, type EstimateConfig } from "./schema.ts";
import { toolRootDir } from "./tool-root-dir.ts";

const CONFIG_FILE_NAME = "estimate.config.json";

export function loadEstimateConfig(rootDir: string = toolRootDir()): EstimateConfig {
  const configPath = join(rootDir, CONFIG_FILE_NAME);
  if (!existsSync(configPath)) {
    throw new Error(`${CONFIG_FILE_NAME} not found at ${configPath}.`);
  }
  const raw: unknown = JSON.parse(readFileSync(configPath, "utf8"));
  return estimateConfigSchema.parse(raw);
}
