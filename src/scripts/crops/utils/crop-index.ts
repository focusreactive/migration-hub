import type { CropMiss } from "#ir/crops.ts";
import type { Section } from "#ir/discovery.ts";

import type { CaptureRequest, CropTarget } from "../types.ts";

interface PlanArgs {
  targets: CropTarget[];
  sections: Section[] | undefined;
  route: string;
}

export function planCaptures(args: PlanArgs): { requests: CaptureRequest[]; missing: CropMiss[] } {
  const requests: CaptureRequest[] = [];
  const missing: CropMiss[] = [];

  if (args.sections === undefined) {
    for (const target of args.targets) {
      missing.push({ typeId: target.typeId, route: args.route, order: target.order, reason: "SECTIONS_SHARD_MISSING" });
    }
    return { requests, missing };
  }

  const byOrder = new Map(args.sections.map((section) => [section.order, section]));

  for (const target of args.targets) {
    const section = byOrder.get(target.order);

    if (section === undefined || section.anchor === null) {
      missing.push({ typeId: target.typeId, route: args.route, order: target.order, reason: "NO_ELEMENT" });
      continue;
    }

    requests.push({
      typeId: target.typeId,
      selector: section.anchor.selector,
      signature: section.anchor.signature,
      isFixed: section.anchor.isFixed,
    });
  }

  return { requests, missing };
}
