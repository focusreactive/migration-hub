import { assetIdFromCanonicalUrl, type MediaAssetRecord, type MediaAssetSource, type MediaAssetsData } from "#ir/assets.ts";
import type { FetchClient } from "#lib/fetch/create-fetch-client/index.ts";
import type { MirrorStore } from "#lib/mirror-store/types.ts";

import type { MediaGroup, MediaNormalizer, ScannedMediaRef } from "../../types.ts";

import { scanCssMediaRefs } from "./scan-css-media-refs.ts";
import { scanHtmlMediaRefs } from "./scan-html-media-refs.ts";
import { applyEtagDedup } from "./utils/dedup-by-etag.ts";
import { headProbe } from "./utils/head-probe.ts";

export interface BuildMediaAssetsOpts {
  store: MirrorStore;
  client: FetchClient;
  normalizer: MediaNormalizer;
  origin: string;
  routes: string[];
}

function mostFrequent(values: readonly string[]): string | undefined {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (value.trim() !== "") counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  let best: string | undefined;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

function groupMediaRefs(refs: readonly ScannedMediaRef[], normalizer: MediaNormalizer): MediaGroup[] {
  const groups = new Map<string, MediaGroup>();
  for (const ref of refs) {
    if (normalizer.isVariant(ref.rawUrl)) continue;
    const canonical = normalizer.canonicalize(ref.rawUrl);
    const group = groups.get(canonical.canonicalUrl) ?? {
      canonicalUrl: canonical.canonicalUrl,
      kind: "image" as const,
      sources: new Set<MediaAssetSource>(),
      alts: [],
      ...(canonical.platformId !== undefined && { platformId: canonical.platformId }),
      ...(canonical.originalName !== undefined && { originalName: canonical.originalName }),
    };
    group.sources.add(ref.source);
    if (ref.hint === "video") group.kind = "video";
    if (ref.alt !== undefined) group.alts.push(ref.alt);
    groups.set(canonical.canonicalUrl, group);
  }
  return [...groups.values()].sort((a, b) => a.canonicalUrl.localeCompare(b.canonicalUrl));
}

async function buildMediaAssetRecord(group: MediaGroup, client: FetchClient): Promise<MediaAssetRecord> {
  const assetId = assetIdFromCanonicalUrl(group.canonicalUrl);
  const sources = [...group.sources].sort();
  const alt = mostFrequent(group.alts);
  const { etag, contentType } = await headProbe(client, group.canonicalUrl);

  return {
    assetId,
    canonicalUrl: group.canonicalUrl,
    kind: group.kind,
    contentType,
    etag,
    sources,
    ...(alt !== undefined && { alt }),
    ...(group.platformId !== undefined && { platformId: group.platformId }),
    ...(group.originalName !== undefined && { originalName: group.originalName }),
    duplicateOf: null,
  };
}

export async function buildMediaAssets(opts: BuildMediaAssetsOpts): Promise<MediaAssetsData> {
  const { store, client, normalizer, origin, routes } = opts;

  const mediaRefs: ScannedMediaRef[] = [];

  for (const route of routes) {
    const entry = store.get(new URL(route, origin).toString());
    if (entry === undefined) continue;
    const html = (await store.readBody(entry)).toString("utf8");
    mediaRefs.push(...scanHtmlMediaRefs(html, entry.url));
  }

  for (const entry of store.entries().filter((candidate) => candidate.kind === "style")) {
    const css = (await store.readBody(entry)).toString("utf8");
    mediaRefs.push(...scanCssMediaRefs(css, entry.url));
  }

  const groups = groupMediaRefs(mediaRefs, normalizer);
  const assets: MediaAssetRecord[] = [];
  for (const group of groups) {
    assets.push(await buildMediaAssetRecord(group, client));
  }

  const deduped = applyEtagDedup(assets);

  return { assets: deduped.sort((a, b) => a.assetId.localeCompare(b.assetId)) };
}
