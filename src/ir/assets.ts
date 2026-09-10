import { createHash } from "node:crypto";
import { join } from "node:path";

import { z } from "zod";

import type { ArtifactDef } from "#ir/artifact.ts";
import { assetIdSchema, type AssetId } from "#ir/common.ts";

const ASSET_ID_HEX_LENGTH = 16;
const ARTIFACT_DIR = "assets";

export const mediaAssetKindSchema = z.enum(["image", "video"]);

export const mediaAssetSourceSchema = z.enum([
  "img-src",
  "img-srcset",
  "background-image",
  "css-url",
  "lightbox-json",
  "video-urls",
  "poster-url",
  "og-image",
]);

export const mediaAssetRecordSchema = z.strictObject({
  assetId: assetIdSchema,
  canonicalUrl: z.string(),
  kind: mediaAssetKindSchema,
  contentType: z.string().nullable(),
  etag: z.string().nullable(),
  sources: z.array(mediaAssetSourceSchema).min(1),
  alt: z.string().optional(),
  platformId: z.string().optional(),
  originalName: z.string().optional(),
  duplicateOf: assetIdSchema.nullable(),
});

export const mediaAssetsDataSchema = z.strictObject({
  assets: z.array(mediaAssetRecordSchema),
});

export const fontClassificationSchema = z.enum(["google", "fontshare", "adobe", "custom"]);

export const fontFamilyRecordSchema = z.strictObject({
  family: z.string(),
  weights: z.array(z.string()),
  styles: z.array(z.enum(["normal", "italic"])),
  classification: fontClassificationSchema,
  sources: z.array(z.enum(["font-face", "webfont-load"])).min(1),
});

export const fontFamiliesDataSchema = z.strictObject({
  families: z.array(fontFamilyRecordSchema),
});

export type MediaAssetRecord = z.infer<typeof mediaAssetRecordSchema>;
export type MediaAssetsData = z.infer<typeof mediaAssetsDataSchema>;
export type MediaAssetSource = z.infer<typeof mediaAssetSourceSchema>;
export type FontFamilyRecord = z.infer<typeof fontFamilyRecordSchema>;
export type FontFamiliesData = z.infer<typeof fontFamiliesDataSchema>;

export const mediaAssetsArtifact: ArtifactDef<MediaAssetsData> = {
  kind: "media",
  relativePath: join(ARTIFACT_DIR, "media.json"),
  dataSchema: mediaAssetsDataSchema,
};

export const fontFamiliesArtifact: ArtifactDef<FontFamiliesData> = {
  kind: "fonts",
  relativePath: join(ARTIFACT_DIR, "fonts.json"),
  dataSchema: fontFamiliesDataSchema,
};

export function assetIdFromCanonicalUrl(canonicalUrl: string): AssetId {
  const hex = createHash("sha256").update(canonicalUrl).digest("hex").slice(0, ASSET_ID_HEX_LENGTH);
  return assetIdSchema.parse(hex);
}
