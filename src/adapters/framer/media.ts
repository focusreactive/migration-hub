import type { CanonicalAsset } from "#adapters/shared/media.ts";
import type { MediaNormalizer } from "#assets/types.ts";

const FRAMER_STRIPPED_QUERY_KEYS = ["scale-down-to", "width", "height"];

export function canonicalizeFramerAssetUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  for (const key of FRAMER_STRIPPED_QUERY_KEYS) {
    url.searchParams.delete(key);
  }
  return url.toString();
}

export const framerMediaNormalizer: MediaNormalizer = {
  canonicalize(rawUrl): CanonicalAsset {
    return { canonicalUrl: canonicalizeFramerAssetUrl(rawUrl) };
  },
  isVariant(): boolean {
    return false;
  },
};
