import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";

import { MIRROR_DIR, mirrorPath } from "./paths.ts";
import { mirrorIndexSchema, MIRROR_INDEX_SCHEMA_VERSION, type MirrorEntry, type MirrorIndex } from "./schema.ts";
import type { MirrorKind } from "./types.ts";

export function indexPath(projectPath: string): string {
  return join(projectPath, MIRROR_DIR, "index.json");
}

function readSchemaVersion(raw: unknown): number | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;

  const value = (raw as Record<string, unknown>).schemaVersion;
  return typeof value === "number" ? value : undefined;
}

export async function readIndexIfPresent(projectPath: string): Promise<MirrorIndex | undefined> {
  const filePath = indexPath(projectPath);
  if (!existsSync(filePath)) return undefined;

  const raw: unknown = JSON.parse(await readFile(filePath, "utf8"));

  const schemaVersion = readSchemaVersion(raw);
  if (schemaVersion !== MIRROR_INDEX_SCHEMA_VERSION) {
    throw new Error(
      `mirror index has schemaVersion ${String(schemaVersion)}, this tool expects ${MIRROR_INDEX_SCHEMA_VERSION}. `
        + `Delete ${MIRROR_DIR}/index.json in the project and re-run.`,
    );
  }

  return mirrorIndexSchema.parse(raw);
}

export function resolveRelativePath(
  kind: MirrorKind,
  normalizedUrl: string,
  explicitRelativePath: string | undefined,
  registry: ReadonlyMap<string, MirrorEntry>,
  reservedRawPaths: ReadonlyMap<string, MirrorKind>,
): string {
  if (explicitRelativePath !== undefined) return explicitRelativePath;

  if (kind === "probe") {
    throw new Error("fetchInto: kind 'probe' requires opts.relativePath (mirrorPath does not support 'probe')");
  }

  const existing = new Set<string>();
  for (const entry of registry.values()) {
    if (entry.kind === kind) existing.add(basename(entry.paths.raw));
  }
  for (const [rawPath, reservedKind] of reservedRawPaths) {
    if (reservedKind === kind) existing.add(basename(rawPath));
  }

  return mirrorPath(kind, normalizedUrl, { existing });
}
