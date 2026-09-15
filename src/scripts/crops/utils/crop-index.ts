import type { CropAnchor, CropCandidate, CropMiss } from "#ir/crops.ts";

import type { CaptureRequest, CropTarget } from "../types.ts";

interface PlanArgs {
  targets: CropTarget[];
  anchors: CropAnchor[] | undefined;
  candidates: CropCandidate[];
  route: string;
}

export function planCaptures(args: PlanArgs): { requests: CaptureRequest[]; missing: CropMiss[] } {
  const requests: CaptureRequest[] = [];
  const missing: CropMiss[] = [];

  if (args.anchors === undefined) {
    for (const target of args.targets) {
      missing.push({ typeId: target.typeId, route: args.route, order: target.order, reason: "NO_ANCHORS_SHARD" });
    }
    return { requests, missing };
  }

  const byOrder = new Map(args.anchors.map((anchor) => [anchor.order, anchor.candidateIndex]));

  for (const target of args.targets) {
    const candidateIndex = byOrder.get(target.order);
    if (candidateIndex === undefined) {
      missing.push({ typeId: target.typeId, route: args.route, order: target.order, reason: "NO_ANCHOR_FOR_ORDER" });
      continue;
    }

    const candidate = args.candidates[candidateIndex];
    if (candidate === undefined) {
      missing.push({
        typeId: target.typeId,
        route: args.route,
        order: target.order,
        reason: "CANDIDATE_OUT_OF_RANGE",
      });
      continue;
    }

    requests.push({
      typeId: target.typeId,
      candidateIndex,
      signature: candidate.signature,
      isFixed: candidate.isFixed,
    });
  }

  return { requests, missing };
}
