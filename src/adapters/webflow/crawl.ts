import type { ClassifiedPage } from "#adapters/shared/pages.ts";
import { extractAnchorHrefs } from "#lib/html.ts";
import type { MirrorStore } from "#lib/mirror-store/types.ts";
import { normalizeUrl, routeFromUrl } from "#lib/url.ts";

import { classifyWebflowPage } from "./classify.ts";
import { findPaginations, paginationUrls } from "./pagination.ts";

export interface CrawlResult {
  pages: ClassifiedPage[];
  warnings: string[];
  truncated: boolean;
}

export async function crawlWebflow(opts: {
  origin: string;
  seedUrls: string[];
  store: MirrorStore;
  maxPages: number;
}): Promise<CrawlResult> {
  const { origin, store, maxPages } = opts;

  const warnings: string[] = [];
  const warn = (message: string): void => {
    warnings.push(message);
  };

  const visited = new Set<string>();
  const queued = new Set<string>();
  const queue: string[] = [];

  const enqueue = (rawUrl: string): void => {
    const normalized = normalizeUrl(rawUrl);

    if (visited.has(normalized) || queued.has(normalized)) return;
    queued.add(normalized);
    queue.push(normalized);
  };

  for (const seedUrl of opts.seedUrls) {
    enqueue(seedUrl);
  }

  const classifiedByUrl = new Map<string, ClassifiedPage>();
  const collectionKeysByPageId = new Map<string, Set<string>>();
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
    const classified = classifyWebflowPage(html);

    if (!classified.isWebflow) {
      warn(`non-webflow page: ${url}`);
      continue;
    }

    const route = routeFromUrl(entry.http.finalUrl);

    classifiedByUrl.set(url, {
      route,
      kind: classified.kind,
      ...(classified.collectionKey !== undefined && { collectionKey: classified.collectionKey }),
    });

    if (classified.kind === "item" && classified.pageId !== undefined && classified.collectionKey !== undefined) {
      const collectionKeys = collectionKeysByPageId.get(classified.pageId);
      if (collectionKeys) {
        collectionKeys.add(classified.collectionKey);
      } else {
        collectionKeysByPageId.set(classified.pageId, new Set([classified.collectionKey]));
      }
    }

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

    for (const pagination of findPaginations(html)) {
      for (const pageUrl of paginationUrls(entry.http.finalUrl, pagination)) {
        enqueue(pageUrl);
      }
    }
  }

  for (const [pageId, collectionKeys] of collectionKeysByPageId) {
    if (collectionKeys.size > 1) {
      warn(`pageId ${pageId} maps to multiple collections: ${Array.from(collectionKeys).sort().join(", ")}`);
    }
  }

  return { pages: Array.from(classifiedByUrl.values()), warnings, truncated };
}
