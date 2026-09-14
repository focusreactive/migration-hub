import type { DiscoveryBlocksData, DiscoveryTypesData } from "#ir/discovery.ts";

import type { CropTarget } from "../types.ts";

export function cropTargets(blocks: DiscoveryBlocksData, globals: DiscoveryTypesData): CropTarget[] {
  const fromGlobals = globals.types.map((type) => ({
    typeId: type.id,
    name: type.name,
    route: type.exemplar.route,
    order: type.exemplar.order,
    isGlobal: true,
  }));

  const fromBlocks = blocks.types.map((type) => ({
    typeId: type.id,
    name: type.name,
    route: type.exemplar.route,
    order: type.exemplar.order,
    isGlobal: false,
  }));

  return [...fromGlobals, ...fromBlocks];
}

export function groupTargetsByRoute(targets: CropTarget[]): Map<string, CropTarget[]> {
  const grouped = new Map<string, CropTarget[]>();

  for (const target of targets) {
    const bucket = grouped.get(target.route);
    if (bucket === undefined) grouped.set(target.route, [target]);
    else bucket.push(target);
  }

  for (const bucket of grouped.values()) bucket.sort((a, b) => a.order - b.order);

  return grouped;
}
