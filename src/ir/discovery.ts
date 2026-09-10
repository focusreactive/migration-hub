import { join } from "node:path";

import { z } from "zod";

import type { ArtifactDef } from "#ir/artifact.ts";
import { typeIdSchema } from "#ir/common.ts";

export const sectionSchema = z.strictObject({
  order: z.number().int().nonnegative(),
  role: z.string().min(1),
  summary: z.string(),
});

export const sectionsShardDataSchema = z.strictObject({
  route: z.string().min(1),
  globals: z.array(sectionSchema),
  blocks: z.array(sectionSchema),
});

export const memberSchema = z.strictObject({
  route: z.string().min(1),
  order: z.number().int().nonnegative(),
});

export const discoveryTypeSchema = z.strictObject({
  id: typeIdSchema,
  name: z.string().min(1),
  role: z.string().min(1),
  instanceCount: z.number().int().positive(),
  members: z.array(memberSchema).min(1),
  exemplar: memberSchema,
});

export const discoveryTypesDataSchema = z.strictObject({
  types: z.array(discoveryTypeSchema),
});

export type Section = z.infer<typeof sectionSchema>;
export type SectionsShardData = z.infer<typeof sectionsShardDataSchema>;
export type Member = z.infer<typeof memberSchema>;
export type DiscoveryType = z.infer<typeof discoveryTypeSchema>;
export type DiscoveryTypesData = z.infer<typeof discoveryTypesDataSchema>;

export function sectionsShardArtifactFor(routeKey: string): ArtifactDef<SectionsShardData> {
  return {
    kind: "discovery-sections-shard",
    relativePath: join("discovery", "sections", `${routeKey}.json`),
    dataSchema: sectionsShardDataSchema,
  };
}

export const discoveryBlocksArtifact: ArtifactDef<DiscoveryTypesData> = {
  kind: "discovery-blocks",
  relativePath: join("discovery", "blocks.json"),
  dataSchema: discoveryTypesDataSchema,
};

export const discoveryGlobalsArtifact: ArtifactDef<DiscoveryTypesData> = {
  kind: "discovery-globals",
  relativePath: join("discovery", "globals.json"),
  dataSchema: discoveryTypesDataSchema,
};
