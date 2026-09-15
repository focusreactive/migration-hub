import { join } from "node:path";

import { z } from "zod";

import { ARTIFACTS_DIR, type ArtifactDef } from "#ir/artifact.ts";
import { typeIdSchema } from "#ir/common.ts";

const CROPS_DIR = "crops";

export const cropCandidateSchema = z.strictObject({
  index: z.number().int().nonnegative(),
  y: z.number().int(),
  height: z.number().int().nonnegative(),
  tag: z.string().min(1),
  classes: z.array(z.string()),
  textSnippet: z.string(),
  isFixed: z.boolean(),
  signature: z.string().min(1),
});

export const cropCandidatesShardDataSchema = z.strictObject({
  route: z.string().min(1),
  viewportWidth: z.number().int().positive(),
  candidates: z.array(cropCandidateSchema),
});

export const cropAnchorSchema = z.strictObject({
  order: z.number().int().nonnegative(),
  candidateIndex: z.number().int().nonnegative(),
});

export const cropAnchorsShardDataSchema = z.strictObject({
  route: z.string().min(1),
  anchors: z.array(cropAnchorSchema),
  unmappable: z.array(z.number().int().nonnegative()),
});

export const cropShotSchema = z.strictObject({
  typeId: typeIdSchema,
  route: z.string().min(1),
  order: z.number().int().nonnegative(),
  relativePath: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const cropMissReasonSchema = z.enum([
  "NO_ANCHORS_SHARD",
  "NO_ANCHOR_FOR_ORDER",
  "CANDIDATE_OUT_OF_RANGE",
  "SIGNATURE_DRIFT",
  "CAPTURE_FAILED",
]);

export const cropMissSchema = z.strictObject({
  typeId: typeIdSchema,
  route: z.string().min(1),
  order: z.number().int().nonnegative(),
  reason: cropMissReasonSchema,
});

export const cropHeroSchema = z.strictObject({
  relativePath: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const cropIndexDataSchema = z.strictObject({
  shots: z.array(cropShotSchema),
  missing: z.array(cropMissSchema),
  hero: cropHeroSchema.optional(),
});

export type CropCandidate = z.infer<typeof cropCandidateSchema>;
export type CropCandidatesShardData = z.infer<typeof cropCandidatesShardDataSchema>;
export type CropAnchor = z.infer<typeof cropAnchorSchema>;
export type CropAnchorsShardData = z.infer<typeof cropAnchorsShardDataSchema>;
export type CropShot = z.infer<typeof cropShotSchema>;
export type CropMissReason = z.infer<typeof cropMissReasonSchema>;
export type CropMiss = z.infer<typeof cropMissSchema>;
export type CropHero = z.infer<typeof cropHeroSchema>;
export type CropIndexData = z.infer<typeof cropIndexDataSchema>;

export function cropCandidatesShardArtifactFor(routeKey: string): ArtifactDef<CropCandidatesShardData> {
  return {
    kind: "crops-candidates-shard",
    relativePath: join(CROPS_DIR, "candidates", `${routeKey}.json`),
    dataSchema: cropCandidatesShardDataSchema,
  };
}

export function cropAnchorsShardArtifactFor(routeKey: string): ArtifactDef<CropAnchorsShardData> {
  return {
    kind: "crops-anchors-shard",
    relativePath: join(CROPS_DIR, "anchors", `${routeKey}.json`),
    dataSchema: cropAnchorsShardDataSchema,
  };
}

export const cropIndexArtifact: ArtifactDef<CropIndexData> = {
  kind: "crops-index",
  relativePath: join(CROPS_DIR, "index.json"),
  dataSchema: cropIndexDataSchema,
};

export function cropShotRelativePath(typeId: string): string {
  return join(CROPS_DIR, "shots", `${typeId}.jpg`);
}

export function cropShotPath(projectPath: string, typeId: string): string {
  return join(projectPath, ARTIFACTS_DIR, cropShotRelativePath(typeId));
}

export function cropHeroRelativePath(): string {
  return join(CROPS_DIR, "hero.jpg");
}

export function cropHeroPath(projectPath: string): string {
  return join(projectPath, ARTIFACTS_DIR, cropHeroRelativePath());
}
