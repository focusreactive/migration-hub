import type { MediaAssetRecord } from "#ir/assets.ts";

const MULTIPART_SUFFIX = /-\d+$/;

export function normalizeEtag(raw: string | null): string | null {
  if (raw === null) return null;

  const trimmed = raw.trim();
  if (trimmed.startsWith("W/")) return null;

  const unquoted = trimmed.replace(/^"|"$/g, "");
  if (unquoted === "") return null;
  if (MULTIPART_SUFFIX.test(unquoted)) return null;

  return unquoted;
}

export function applyEtagDedup(records: MediaAssetRecord[]): MediaAssetRecord[] {
  const firstByKey = new Map<string, string>();

  return records.map((record) => {
    const etag = normalizeEtag(record.etag);
    if (etag === null) return { ...record, duplicateOf: null };

    const key = `${new URL(record.canonicalUrl).origin}|${etag}`;
    const first = firstByKey.get(key);
    if (first === undefined) {
      firstByKey.set(key, record.assetId);
      return { ...record, duplicateOf: null };
    }

    return { ...record, duplicateOf: first };
  });
}
