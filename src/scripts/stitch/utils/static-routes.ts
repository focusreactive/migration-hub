import type { PagesData } from "#ir/pages.ts";

export function staticRoutes(pages: PagesData): string[] {
  return pages.pages.filter((page) => page.kind === "static").map((page) => page.route);
}
