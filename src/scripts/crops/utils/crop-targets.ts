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

  const targets = [...fromGlobals, ...fromBlocks];

  // `typeId` is minted per-artifact in `discovery` (globals and blocks are typed
  // independently), so a global and a block can collide on the same id. `cropShotRelativePath`
  // turns a duplicate id into a duplicate shot filename — the second capture would silently
  // overwrite the first and the index would show two successful shots pointing at one image.
  // The root cause is upstream of this plan; refuse here so the collision cannot amplify.
  const seenTypeIds = new Set<string>();
  for (const target of targets) {
    if (seenTypeIds.has(target.typeId)) {
      throw new Error(`duplicate crop target typeId "${target.typeId}" — discovery minted the same id twice`);
    }
    seenTypeIds.add(target.typeId);
  }

  return targets;
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
