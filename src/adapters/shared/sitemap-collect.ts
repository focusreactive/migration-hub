import { join } from "node:path/posix";

import { sanitizeFileName } from "#lib/fs.ts";
import type { MirrorStore } from "#lib/mirror-store/types.ts";
import { parseSitemap } from "#lib/sitemap.ts";

const DISCOVERY_DIR = "discovery";

function lastPathSegment(url: string): string {
  const segments = new URL(url).pathname.split("/").filter(Boolean);

  return segments.at(-1) ?? "sitemap.xml";
}

function discoveryRelativePath(url: string, existing: Set<string>): string {
  const fileName = sanitizeFileName(lastPathSegment(url), { existing });
  existing.add(fileName);

  return join(DISCOVERY_DIR, fileName);
}

async function collectChildUrlsetLocs(opts: {
  childLoc: string;
  store: MirrorStore;
  relativePath: string;
}): Promise<string[]> {
  const { childLoc, store, relativePath } = opts;

  try {
    const entry = await store.fetchInto(childLoc, "page", { relativePath });
    const body = await store.readBody(entry);
    const parsed = parseSitemap(body.toString("utf8"));

    if (parsed.kind !== "urlset") {
      return [];
    }

    return parsed.entries.map((sitemapEntry) => sitemapEntry.loc);
  } catch {
    return [];
  }
}

export async function collectSitemapUrls(opts: {
  rootSitemapXml: string | undefined;
  store: MirrorStore;
}): Promise<string[]> {
  const { rootSitemapXml, store } = opts;

  if (rootSitemapXml === undefined) return [];

  const root = parseSitemap(rootSitemapXml);

  let locs: string[];
  if (root.kind === "urlset") {
    locs = root.entries.map((entry) => entry.loc);
  } else if (root.kind === "sitemapindex") {
    const existingRelativePaths = new Set<string>();
    const childLocLists = await Promise.all(
      root.entries.map((entry) =>
        collectChildUrlsetLocs({
          childLoc: entry.loc,
          store,
          relativePath: discoveryRelativePath(entry.loc, existingRelativePaths),
        }),
      ),
    );
    locs = childLocLists.flat();
  } else {
    locs = [];
  }

  return Array.from(new Set(locs));
}
