import { join } from "node:path/posix";

import { parseHydrateV2 } from "#adapters/framer/hydrate.ts";
import type { ClassifiedPage } from "#adapters/shared/pages.ts";
import { extractAnchorHrefs } from "#lib/html.ts";
import type { MirrorStore } from "#lib/mirror-store/types.ts";
import { normalizeUrl, routeFromUrl } from "#lib/url.ts";

import { parseSearchIndexPaths } from "./searchindex.ts";

const SEARCH_INDEX_RELATIVE_PATH = join("discovery", "search-index.json");

export interface CrawlResult {
  pages: ClassifiedPage[];
  warnings: string[];
  truncated: boolean;
}

export async function crawlFramer(opts: {
  origin: string;
  sitemapUrls: string[];
  searchIndexUrl?: string;
  sourceUrl: string;
  store: MirrorStore;
  maxPages: number;
}): Promise<CrawlResult> {
  const { origin, sitemapUrls, searchIndexUrl, sourceUrl, store, maxPages } = opts;

  const warnings: string[] = [];
  const warn = (message: string): void => {
    warnings.push(message);
  };

  const visited = new Set<string>();
  const queued = new Set<string>();
  const queue: string[] = [];

  const enqueue = (rawUrl: string): void => {
    let normalized: string;
    try {
      normalized = normalizeUrl(rawUrl);
    } catch {
      return;
    }

    if (visited.has(normalized) || queued.has(normalized)) return;
    queued.add(normalized);
    queue.push(normalized);
  };

  const followLinks = sitemapUrls.length === 0;

  if (sitemapUrls.length > 0) {
    enqueue(sourceUrl);
    for (const url of sitemapUrls) {
      let sitemapOrigin: string;
      try {
        sitemapOrigin = new URL(url).origin;
      } catch {
        continue;
      }
      if (sitemapOrigin !== origin) continue;

      enqueue(url);
    }
  } else {
    if (searchIndexUrl !== undefined) {
      try {
        const entry = await store.fetchInto(searchIndexUrl, "page", { relativePath: SEARCH_INDEX_RELATIVE_PATH });
        const body = await store.readBody(entry);
        const paths = parseSearchIndexPaths(body.toString("utf8"));
        for (const path of paths) {
          enqueue(new URL(path, origin).toString());
        }
      } catch (error) {
        warn(`searchIndex fetch error: ${searchIndexUrl}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    enqueue(sourceUrl);
  }

  const classifiedByUrl = new Map<string, ClassifiedPage>();
  let fetchedCount = 0;
  let truncated = false;

  for (;;) {
    const url = queue.shift();
    if (url === undefined) break;

    if (fetchedCount >= maxPages) {
      truncated = true;
      warn(`maxPages reached (${maxPages})`);
      break;
    }

    queued.delete(url);
    visited.add(url);

    fetchedCount += 1;

    let entry;
    try {
      entry = await store.fetchInto(url, "page");
    } catch (error) {
      warn(`fetch error: ${url}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }

    if (entry.http.status >= 400) {
      warn(`fetch failed: ${url} (status ${entry.http.status})`);
      continue;
    }

    const body = await store.readBody(entry);
    const html = body.toString("utf8");
    const hydrate = parseHydrateV2(html);

    if (hydrate.routeId === undefined) {
      warn(`non-framer page: ${url}`);
      continue;
    }

    const route = routeFromUrl(entry.http.finalUrl);

    const kind: ClassifiedPage["kind"] = hydrate.collectionItemId !== undefined ? "item" : "static";

    classifiedByUrl.set(url, {
      route,
      kind,
      ...(kind === "item" && { collectionKey: hydrate.routeId }),
    });

    if (!followLinks) continue;

    for (const href of extractAnchorHrefs(html)) {
      let resolvedUrl: string;
      try {
        resolvedUrl = new URL(href, entry.http.finalUrl).toString();
      } catch {
        continue;
      }

      const normalized = normalizeUrl(resolvedUrl);
      if (new URL(normalized).origin !== origin) continue;

      enqueue(normalized);
    }
  }

  return { pages: Array.from(classifiedByUrl.values()), warnings, truncated };
}
