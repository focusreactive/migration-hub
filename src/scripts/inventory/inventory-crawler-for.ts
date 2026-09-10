import { framerInventoryCrawler } from "#adapters/framer/inventory.ts";
import type { InventoryCrawler } from "#adapters/shared/inventory.ts";
import { webflowInventoryCrawler } from "#adapters/webflow/inventory.ts";

export function inventoryCrawlerFor(adapter: "webflow" | "framer"): InventoryCrawler {
  switch (adapter) {
    case "webflow":
      return webflowInventoryCrawler;
    case "framer":
      return framerInventoryCrawler;
  }
}
