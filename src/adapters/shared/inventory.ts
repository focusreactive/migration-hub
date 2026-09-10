import type { ClassifiedPage } from "#adapters/shared/pages.ts";
import type { PlatformHints } from "#ir/detect.ts";
import type { MirrorStore } from "#lib/mirror-store/types.ts";

export interface InventoryCrawlContext {
  origin: string;
  sourceUrl: string;
  sitemapUrls: string[];
  platformHints: PlatformHints;
  store: MirrorStore;
  maxPages: number;
}

export interface InventoryCrawlResult {
  pages: ClassifiedPage[];
  warnings: string[];
  truncated: boolean;
}

export type InventoryCrawler = (context: InventoryCrawlContext) => Promise<InventoryCrawlResult>;
