import type { DiscoveryBlocksData, DiscoveryTypesData, SectionsShardData } from "#ir/discovery.ts";
import type { PagesData } from "#ir/pages.ts";
import { collectionNameFromRoutePattern } from "#report/utils/collection-name.ts";
import { pageLabel } from "#report/utils/page-label.ts";
import { captureRoutes } from "#stitch/utils/capture-routes.ts";

export interface IndexedSection {
  order: number;
  typeId: string;
  name: string;
  isGlobal: boolean;
}

export interface IndexedPage {
  route: string;
  title: string;
  isCollectionTemplate: boolean;
  sections: IndexedSection[];
}

interface IndexArgs {
  pages: PagesData;
  blocks: DiscoveryBlocksData;
  globals: DiscoveryTypesData;
}

function pageTitle(pages: PagesData, route: string): { title: string; isCollectionTemplate: boolean } {
  const page = pages.pages.find((candidate) => candidate.route === route);
  if (page?.kind !== "item") return { title: pageLabel(route).name, isCollectionTemplate: false };

  const collection = pages.collections.find((candidate) => candidate.key === page.collectionKey);
  const name = collection === undefined ? route : collectionNameFromRoutePattern(collection.routePattern);
  return { title: `${name} template page`, isCollectionTemplate: true };
}

export function buildSectionIndex(args: IndexArgs): IndexedPage[] {
  const byRoute = new Map<string, IndexedSection[]>();

  const add = (route: string, section: IndexedSection): void => {
    const bucket = byRoute.get(route);
    if (bucket === undefined) byRoute.set(route, [section]);
    else bucket.push(section);
  };

  for (const type of args.globals.types) {
    for (const member of type.members) {
      add(member.route, { order: member.order, typeId: type.id, name: type.name, isGlobal: true });
    }
  }

  for (const type of args.blocks.types) {
    for (const member of type.members) {
      add(member.route, { order: member.order, typeId: type.id, name: type.name, isGlobal: false });
    }
  }

  return captureRoutes(args.pages).map((route) => {
    const sections = (byRoute.get(route) ?? []).slice().sort((a, b) => a.order - b.order);
    return { route, ...pageTitle(args.pages, route), sections };
  });
}

interface SummaryArgs {
  typeId: string;
  blocks: DiscoveryBlocksData;
  globals: DiscoveryTypesData;
  shards: SectionsShardData[];
}

export function summaryForType(args: SummaryArgs): string | undefined {
  const type =
    args.blocks.types.find((candidate) => candidate.id === args.typeId)
    ?? args.globals.types.find((candidate) => candidate.id === args.typeId);
  if (type === undefined) return undefined;

  const shard = args.shards.find((candidate) => candidate.route === type.exemplar.route);
  if (shard === undefined) return undefined;

  const section = [...shard.globals, ...shard.blocks].find((candidate) => candidate.order === type.exemplar.order);
  return section?.summary === undefined || section.summary === "" ? undefined : section.summary;
}
