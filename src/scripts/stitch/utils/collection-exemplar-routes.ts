import type { PagesData } from "#ir/pages.ts";

export function collectionExemplarRoutes(pages: PagesData): string[] {
  const seen = new Set<string>();
  const routes: string[] = [];

  for (const page of pages.pages) {
    if (page.kind !== "item" || page.collectionKey === undefined) continue;
    if (seen.has(page.collectionKey)) continue;
    seen.add(page.collectionKey);
    routes.push(page.route);
  }

  return routes;
}
