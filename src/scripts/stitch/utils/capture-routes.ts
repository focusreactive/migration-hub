import type { PagesData } from "#ir/pages.ts";

import { collectionExemplarRoutes } from "./collection-exemplar-routes.ts";
import { staticRoutes } from "./static-routes.ts";

export function captureRoutes(pages: PagesData): string[] {
  return [...staticRoutes(pages), ...collectionExemplarRoutes(pages)];
}
