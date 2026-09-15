import type { PagesData } from "#ir/pages.ts";
import { displayRoute } from "#report/utils/page-label.ts";

import { escapeAttr, escapeHtml } from "./escape.ts";

export interface Linker {
  displayPath(route: string): string;
  href(route: string): string;
  anchor(route: string): string;
  collectionAnchor(collectionKey: string): string;
  routeAnchor(route: string): string;
}

interface LinkerInput {
  sourceUrl: string;
  pages: PagesData;
}

function link(href: string, title: string, label: string): string {
  return (
    `<a class="mono pathlink" href="${escapeAttr(href)}" target="_blank" rel="noreferrer"`
    + ` title="${escapeAttr(title)}">${escapeHtml(label)}</a>`
  );
}

export function createLinker(input: LinkerInput): Linker {
  const origin = new URL(input.sourceUrl).origin;
  const hostname = new URL(input.sourceUrl).hostname;

  const exemplarByKey = new Map<string, string>();
  for (const page of input.pages.pages) {
    if (page.kind !== "item" || page.collectionKey === undefined) continue;
    if (!exemplarByKey.has(page.collectionKey)) exemplarByKey.set(page.collectionKey, page.route);
  }

  const collectionByKey = new Map(input.pages.collections.map((collection) => [collection.key, collection]));

  const collectionKeyByRoute = new Map<string, string>();
  for (const page of input.pages.pages) {
    if (page.kind === "item" && page.collectionKey !== undefined) {
      collectionKeyByRoute.set(page.route, page.collectionKey);
    }
  }

  const displayPath = displayRoute;
  const href = (route: string): string => new URL(route, origin).toString();

  const anchor = (route: string): string =>
    link(href(route), route === "/" ? `Home · ${hostname}` : `Open ${route} on ${hostname}`, displayPath(route));

  const collectionAnchor = (collectionKey: string): string => {
    const collection = collectionByKey.get(collectionKey);
    if (collection === undefined) {
      throw new Error(`pages.json has no collection with key "${collectionKey}"`);
    }

    const exemplar = exemplarByKey.get(collectionKey);
    if (exemplar === undefined) {
      return (
        `<span class="mono pathlink" title="${escapeAttr(`No documents published · ${collection.routePattern}`)}">`
        + `${escapeHtml(collection.routePattern)}</span>`
      );
    }

    return link(href(exemplar), `Example document · ${exemplar}`, collection.routePattern);
  };

  return {
    displayPath,
    href,
    anchor,
    collectionAnchor,
    routeAnchor(route: string): string {
      const key = collectionKeyByRoute.get(route);
      return key === undefined ? anchor(route) : collectionAnchor(key);
    },
  };
}
