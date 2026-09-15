import { join } from "node:path";

import { z } from "zod";

import { ARTIFACTS_DIR, type ArtifactDef } from "#ir/artifact.ts";
import { typeIdSchema } from "#ir/common.ts";

const CROPS_DIR = "crops";

export const cropShotSchema = z.strictObject({
  typeId: typeIdSchema,
  route: z.string().min(1),
  order: z.number().int().nonnegative(),
  relativePath: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const cropMissReasonSchema = z.enum([
  "SECTIONS_SHARD_MISSING",
  "NO_ELEMENT",
  "SELECTOR_UNRESOLVED",
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

export type CropShot = z.infer<typeof cropShotSchema>;
export type CropMissReason = z.infer<typeof cropMissReasonSchema>;
export type CropMiss = z.infer<typeof cropMissSchema>;
export type CropHero = z.infer<typeof cropHeroSchema>;
export type CropIndexData = z.infer<typeof cropIndexDataSchema>;

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
