import type { AcceptError } from "#discovery/types.ts";

import type { CropCandidate } from "#ir/crops.ts";

import type { AnchorsResponse } from "../../../schemas/anchors-response.ts";

interface ValidateArgs {
  response: AnchorsResponse;
  requestedRoute: string;
  orders: number[];
  candidates: CropCandidate[];
}

export function validateAnchorsResponse(args: ValidateArgs): AcceptError[] {
  const errors: AcceptError[] = [];
  const { response, requestedRoute, orders, candidates } = args;
  const candidateCount = candidates.length;
  const pinnedCandidateIndices = new Set(
    candidates.filter((candidate) => candidate.isFixed).map((candidate) => candidate.index),
  );

  if (response.route !== requestedRoute) {
    errors.push({
      code: "ROUTE_MISMATCH",
      where: "route",
      detail: `the response is for "${response.route}", but acceptance was asked about "${requestedRoute}"`,
      fix: "Set route to the route the subject step printed.",
    });
  }

  const known = new Set(orders);
  const seenOrders = new Set<number>();
  const seenCandidates = new Map<number, number>();
  const unmappable = response.unmappable ?? [];
  const unmappableOrders = new Set(unmappable);

  for (const anchor of response.anchors) {
    if (!known.has(anchor.order)) {
      errors.push({
        code: "UNKNOWN_ORDER",
        where: `anchors[order=${anchor.order}]`,
        detail: `this route has no section with order ${anchor.order}`,
        fix: `Use only the orders the subject listed: ${orders.join(", ")}.`,
      });
    }

    if (seenOrders.has(anchor.order)) {
      errors.push({
        code: "DUPLICATE_ORDER",
        where: `anchors[order=${anchor.order}]`,
        detail: `order ${anchor.order} is mapped more than once`,
        fix: "Map every order exactly once.",
      });
    }
    seenOrders.add(anchor.order);

    if (unmappableOrders.has(anchor.order)) {
      errors.push({
        code: "CONTRADICTORY_ORDER",
        where: `anchors[order=${anchor.order}]`,
        detail: `order ${anchor.order} is both anchored to a candidate and listed as unmappable`,
        fix: "Choose one: either map this order to a candidate, or list it under unmappable, not both.",
      });
    }

    if (anchor.candidateIndex >= candidateCount) {
      errors.push({
        code: "CANDIDATE_OUT_OF_RANGE",
        where: `anchors[order=${anchor.order}].candidateIndex`,
        detail: `candidateIndex ${anchor.candidateIndex} is past the last candidate (${candidateCount - 1})`,
        fix: `Pick an index between 0 and ${candidateCount - 1}.`,
      });
    }

    const owner = seenCandidates.get(anchor.candidateIndex);
    if (owner !== undefined) {
      errors.push({
        code: "DUPLICATE_CANDIDATE",
        where: `anchors[order=${anchor.order}].candidateIndex`,
        detail: `candidate ${anchor.candidateIndex} is already used by order ${owner}`,
        fix: "Two sections cannot be the same element — pick a different candidate for one of them.",
      });
    } else {
      seenCandidates.set(anchor.candidateIndex, anchor.order);
    }
  }

  for (const order of unmappable) {
    if (!known.has(order)) {
      errors.push({
        code: "UNKNOWN_ORDER",
        where: `unmappable[order=${order}]`,
        detail: `this route has no section with order ${order}`,
        fix: `Use only the orders the subject listed: ${orders.join(", ")}.`,
      });
    }
  }

  for (const order of orders) {
    if (seenOrders.has(order) || unmappableOrders.has(order)) continue;
    errors.push({
      code: "MISSING_ORDER",
      where: `anchors[order=${order}]`,
      detail: `section ${order} is neither anchored to a candidate nor listed as unmappable`,
      fix: "Map every section the subject listed to a candidate, or list it under unmappable if the DOM genuinely has no element for it.",
    });
  }

  const inFlow = response.anchors
    .filter((anchor) => !pinnedCandidateIndices.has(anchor.candidateIndex))
    .sort((a, b) => a.order - b.order);
  for (let index = 1; index < inFlow.length; index += 1) {
    const previous = inFlow[index - 1];
    const current = inFlow[index];
    if (previous === undefined || current === undefined) continue;
    if (current.candidateIndex > previous.candidateIndex) continue;

    errors.push({
      code: "NOT_MONOTONIC",
      where: `anchors[order=${current.order}].candidateIndex`,
      detail:
        `order ${current.order} points at in-flow candidate ${current.candidateIndex}, which is not after `
        + `order ${previous.order}'s in-flow candidate ${previous.candidateIndex}`,
      fix:
        "In-flow candidate indices must increase with section order, top to bottom. A pinned (fixed/sticky) "
        + "candidate is exempt from this check — it sits outside document flow, so its index says nothing about "
        + "reading order.",
    });
  }

  return errors;
}
