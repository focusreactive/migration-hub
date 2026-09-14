import type { DiscoveryContentKind } from "#ir/discovery.ts";

export const SOURCE_LABEL: Record<"webflow" | "framer", string> = { webflow: "Webflow", framer: "Framer" };

export const KIND_LABEL: Record<DiscoveryContentKind, string> = {
  block: "Block",
  collectionSection: "Collection section",
};
