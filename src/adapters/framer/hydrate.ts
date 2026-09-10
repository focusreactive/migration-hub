import { decodeHtmlAttribute } from "#detect/hints.ts";

export interface FramerHydrate {
  routeId?: string;
  collectionItemId?: string;
}

const HYDRATE_V2_RE = /data-framer-hydrate-v2=["']([^"']*)["']/i;

export function parseHydrateV2(html: string): FramerHydrate {
  const raw = HYDRATE_V2_RE.exec(html)?.[1];
  if (raw === undefined) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeHtmlAttribute(raw));
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null) {
    return {};
  }

  const record = parsed as Record<string, unknown>;
  const routeId = record["routeId"];
  const collectionItemId = record["collectionItemId"];

  return {
    ...(typeof routeId === "string" && { routeId }),
    ...(typeof collectionItemId === "string" && { collectionItemId }),
  };
}
