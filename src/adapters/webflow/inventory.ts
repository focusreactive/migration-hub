import type { InventoryCrawler } from "#adapters/shared/inventory.ts";
import { crawlWebflow } from "#adapters/webflow/crawl.ts";

export const webflowInventoryCrawler: InventoryCrawler = async (context) => {
  const seedUrls = [context.sourceUrl, ...context.sitemapUrls];

  return crawlWebflow({
    origin: context.origin,
    seedUrls,
    store: context.store,
    maxPages: context.maxPages,
  });
};
