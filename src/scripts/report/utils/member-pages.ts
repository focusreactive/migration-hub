import type { PagesData } from "#ir/pages.ts";

import { collectionNameFromRoutePattern, collectionTemplateLabel } from "./collection-name.ts";
import { displayRoute } from "./page-label.ts";

export interface MemberPageLabel {
  label: string;
  isRoute: boolean;
}

function collectionMemberLabel(pages: PagesData, route: string): string | undefined {
  const page = pages.pages.find((candidate) => candidate.route === route);
  if (page?.kind !== "item") return undefined;

  const collection = pages.collections.find((candidate) => candidate.key === page.collectionKey);
  const name = collection === undefined ? route : collectionNameFromRoutePattern(collection.routePattern);
  return collectionTemplateLabel(name);
}

export function memberPageLabels(pages: PagesData, members: { route: string }[]): MemberPageLabel[] {
  const seen = new Set<string>();
  const labels: MemberPageLabel[] = [];

  for (const member of members) {
    const collectionLabel = collectionMemberLabel(pages, member.route);
    const label = collectionLabel ?? displayRoute(member.route);
    if (seen.has(label)) continue;

    seen.add(label);
    labels.push({ label, isRoute: collectionLabel === undefined });
  }

  return labels;
}
