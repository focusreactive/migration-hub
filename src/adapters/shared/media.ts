export interface CanonicalAsset {
  canonicalUrl: string;
  platformId?: string;
  originalName?: string;
}

export function safeDecodeUriComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function assetFileSegment(rawUrl: string): string {
  const { pathname } = new URL(rawUrl);
  const segment = pathname.split("/").pop() ?? "";
  return safeDecodeUriComponent(segment);
}
