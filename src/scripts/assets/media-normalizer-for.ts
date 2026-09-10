import { framerMediaNormalizer } from "#adapters/framer/media.ts";
import { webflowMediaNormalizer } from "#adapters/webflow/media.ts";

import type { MediaNormalizer } from "./types.ts";

export function mediaNormalizerFor(adapter: "webflow" | "framer"): MediaNormalizer {
  switch (adapter) {
    case "webflow":
      return webflowMediaNormalizer;
    case "framer":
      return framerMediaNormalizer;
  }
}
