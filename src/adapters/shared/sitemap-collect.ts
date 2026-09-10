import { parseSitemap } from "#lib/sitemap.ts";
import type { MirrorStore } from "#lib/mirror-store/types.ts";

async function collectChildUrlsetLocs(opts: { childLoc: string; store: MirrorStore }): Promise<string[]> {
  const { childLoc, store } = opts;

  try {
    const entry = await store.fetchInto(childLoc, "page");
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
    const childLocLists = await Promise.all(
      root.entries.map((entry) => collectChildUrlsetLocs({ childLoc: entry.loc, store })),
    );
    locs = childLocLists.flat();
  } else {
    locs = [];
  }

  return Array.from(new Set(locs));
}
