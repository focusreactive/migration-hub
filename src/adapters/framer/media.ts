import { assetFileSegment, type CanonicalAsset } from "#adapters/shared/media.ts";
import type { MediaNormalizer } from "#assets/types.ts";
import { sanitizeFileName } from "#lib/fs.ts";

const FRAMER_RESIZE_QUERY_KEY = "scale-down-to";

export function canonicalizeFramerAssetUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  url.searchParams.delete(FRAMER_RESIZE_QUERY_KEY);
  return url.toString();
}

export function framerAssetFileName(canonicalUrl: string): string {
  return sanitizeFileName(assetFileSegment(canonicalUrl));
}

export const framerMediaNormalizer: MediaNormalizer = {
  canonicalize(rawUrl): CanonicalAsset {
    return { canonicalUrl: canonicalizeFramerAssetUrl(rawUrl) };
  },
  isVariant(): boolean {
    return false;
  },
  fileName: framerAssetFileName,
};
