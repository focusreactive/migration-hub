import type { DiscoveryBlockType, DiscoveryContentKind, DiscoveryType } from "#ir/discovery.ts";
import { slugifyId } from "#lib/slug.ts";

export interface DedupInstance {
  kind: "global" | "block";
  route: string;
  order: number;
  role: string;
  summary: string;
}

export interface DedupGroup {
  kind: "global" | "block";
  name: string;
  role: string;
  members: { route: string; order: number }[];
  exemplar: { route: string; order: number };
}

export function mintTypeId(role: string, used: Set<string>): string {
  const base = slugifyId(role);
  let id = base;
  let suffix = 2;
  while (used.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }
  used.add(id);
  return id;
}

export function foldTypes(groups: DedupGroup[], _instances: DedupInstance[]): DiscoveryType[] {
  const used = new Set<string>();

  return groups.map((group) => ({
    id: mintTypeId(group.role, used),
    name: group.name,
    role: group.role,
    instanceCount: group.members.length,
    members: group.members,
    exemplar: group.exemplar,
  }));
}

function kindsFor(members: { route: string }[], collectionExemplarRoutes: Set<string>): DiscoveryContentKind[] {
  const kinds = new Set<DiscoveryContentKind>();
  for (const member of members) {
    kinds.add(collectionExemplarRoutes.has(member.route) ? "collectionSection" : "block");
  }
  return [...kinds].sort();
}

export function foldBlockTypes(
  groups: DedupGroup[],
  _instances: DedupInstance[],
  collectionExemplarRoutes: Set<string>,
): DiscoveryBlockType[] {
  const used = new Set<string>();

  return groups.map((group) => ({
    id: mintTypeId(group.role, used),
    name: group.name,
    role: group.role,
    instanceCount: group.members.length,
    members: group.members,
    exemplar: group.exemplar,
    kinds: kindsFor(group.members, collectionExemplarRoutes),
  }));
}
