import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";

import { ASSESSMENT_DIR } from "#ir/artifact.ts";
import { writeFileAtomic } from "#lib/fs.ts";
import { loadAssessmentConfig, toolRootDir } from "#lib/assessment-config/index.ts";
import { initManifest } from "#lib/manifest/index.ts";
import { runConfigPath } from "#run-config/load.ts";

const TOOL_VERSION = "0.1.0";

export function projectNameFromUrl(sourceUrl: string): string {
  const host = new URL(sourceUrl).hostname.replace(/^www\./, "");
  return host.replace(/\./g, "-");
}

export async function prepareProject(sourceUrl: string): Promise<{ status: "created" | "existing"; projectPath: string }> {
  const config = loadAssessmentConfig();
  const workspace = isAbsolute(config.workspace.path)
    ? config.workspace.path
    : resolve(toolRootDir(), config.workspace.path);

  const projectName = projectNameFromUrl(sourceUrl);
  const projectPath = join(workspace, projectName);

  if (existsSync(join(projectPath, ASSESSMENT_DIR, "manifest.json"))) {
    return { status: "existing", projectPath };
  }

  const configPath = runConfigPath(projectPath);
  await mkdir(dirname(configPath), { recursive: true });
  await writeFileAtomic(configPath, `${JSON.stringify({ sourceUrl, projectName }, null, 2)}\n`);
  await initManifest(projectPath, { toolVersion: TOOL_VERSION, sourceUrl });

  return { status: "created", projectPath };
}
