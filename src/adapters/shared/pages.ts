import type { PagesData } from "#ir/pages.ts";

export interface ClassifiedPage {
  route: string;
  kind: "static" | "item";
  collectionKey?: string;
}

type PageRecord = PagesData["pages"][number];
type CollectionRecord = PagesData["collections"][number];

function directoryOf(route: string): string {
  const separatorIndex = route.lastIndexOf("/");

  return separatorIndex <= 0 ? "" : route.slice(0, separatorIndex);
}

function toPageRecord(page: ClassifiedPage): PageRecord {
  return {
    route: page.route,
    kind: page.kind,
    ...(page.collectionKey !== undefined ? { collectionKey: page.collectionKey } : {}),
  };
}

function buildCollection(key: string, items: PageRecord[]): CollectionRecord {
  const [firstItem] = items;
  if (!firstItem) {
    throw new Error(`unreachable: empty collection group for key "${key}"`);
  }

  return {
    key,
    routePattern: `${directoryOf(firstItem.route)}/:slug`,
    itemCount: items.length,
  };
}

export function buildPagesData(classified: ClassifiedPage[]): PagesData {
  const byRoute = new Map<string, ClassifiedPage>();
  for (const page of classified) {
    if (!byRoute.has(page.route)) {
      byRoute.set(page.route, page);
    }
  }

  const pages = Array.from(byRoute.values())
    .map(toPageRecord)
    .sort((a, b) => a.route.localeCompare(b.route));

  const itemsByCollection = new Map<string, PageRecord[]>();
  for (const page of pages) {
    if (page.kind !== "item" || page.collectionKey === undefined) {
      continue;
    }

    const group = itemsByCollection.get(page.collectionKey);
    if (group) {
      group.push(page);
    } else {
      itemsByCollection.set(page.collectionKey, [page]);
    }
  }

  const collections = Array.from(itemsByCollection.entries())
    .map(([key, items]) => buildCollection(key, items))
    .sort((a, b) => a.key.localeCompare(b.key));

  return { pages, collections };
}
