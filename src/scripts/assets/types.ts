import type { CanonicalAsset } from "#adapters/shared/media.ts";
import type { MediaAssetRecord, MediaAssetSource } from "#ir/assets.ts";

export type MediaAssetKind = MediaAssetRecord["kind"];

export interface MediaNormalizer {
  canonicalize(rawUrl: string): CanonicalAsset;
  isVariant(rawUrl: string): boolean;
  fileName(canonicalUrl: string): string;
}

export interface ScannedMediaRef {
  rawUrl: string;
  source: MediaAssetSource;
  hint: MediaAssetKind;
  alt?: string;
}

export interface MediaGroup {
  canonicalUrl: string;
  kind: MediaAssetKind;
  sources: Set<MediaAssetSource>;
  alts: string[];
  platformId?: string;
  originalName?: string;
}
