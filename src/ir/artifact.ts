import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { z } from "zod";

import { writeFileAtomic } from "#lib/fs.ts";

export const ESTIMATE_DIR = ".estimate";

const ARTIFACTS_DIR = join(ESTIMATE_DIR, "artifacts");

export interface ArtifactDef<D> {
  kind: string;
  relativePath: string;
  dataSchema: z.ZodType<D>;
}

export function artifactPath(projectPath: string, def: ArtifactDef<unknown>): string {
  return join(projectPath, ARTIFACTS_DIR, def.relativePath);
}

export async function writeArtifact<D>(projectPath: string, def: ArtifactDef<D>, data: D): Promise<void> {
  const validated = def.dataSchema.parse(data);
  const path = artifactPath(projectPath, def);
  await mkdir(dirname(path), { recursive: true });
  await writeFileAtomic(path, `${JSON.stringify(validated, null, 2)}\n`);
}

export async function readArtifact<D>(projectPath: string, def: ArtifactDef<D>): Promise<D> {
  const raw: unknown = JSON.parse(await readFile(artifactPath(projectPath, def), "utf8"));
  return def.dataSchema.parse(raw);
}
