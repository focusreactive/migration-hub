import type { PagesData } from "#ir/pages.ts";

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

  const displayPath = (route: string): string => (route === "/" ? "/home" : route);
  const href = (route: string): string => new URL(route, origin).toString();

  const anchor = (route: string): string =>
    link(href(route), route === "/" ? `Home · ${hostname}` : `Open ${route} on ${hostname}`, displayPath(route));

  const collectionAnchor = (collectionKey: string): string => {
    const collection = collectionByKey.get(collectionKey);
    if (collection === undefined) {
      // A page claims a collectionKey no collection declares: the artifact is corrupt.
      // Rendering an empty string here would leave an invisible gap in the report.
      throw new Error(`pages.json has no collection with key "${collectionKey}"`);
    }

    const exemplar = exemplarByKey.get(collectionKey);
    if (exemplar === undefined) {
      // A collection with no published documents has nothing to link to. Render the
      // pattern as plain text rather than a link to the site root: an anchor styled
      // like every other one, promising a collection path and landing on the
      // homepage, reads as a broken link and costs the report its credibility.
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
