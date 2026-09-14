import type { AcceptError } from "#discovery/types.ts";

import type { AnchorsResponse } from "../../../schemas/anchors-response.ts";

interface ValidateArgs {
  response: AnchorsResponse;
  requestedRoute: string;
  orders: number[];
  candidateCount: number;
}

export function validateAnchorsResponse(args: ValidateArgs): AcceptError[] {
  const errors: AcceptError[] = [];
  const { response, requestedRoute, orders, candidateCount } = args;

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

  for (const order of orders) {
    if (seenOrders.has(order)) continue;
    errors.push({
      code: "MISSING_ORDER",
      where: `anchors[order=${order}]`,
      detail: `section ${order} has no anchor`,
      fix: "Map every section the subject listed, including globals.",
    });
  }

  const sorted = [...response.anchors].sort((a, b) => a.order - b.order);
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (previous === undefined || current === undefined) continue;
    if (current.candidateIndex > previous.candidateIndex) continue;

    errors.push({
      code: "NOT_MONOTONIC",
      where: `anchors[order=${current.order}].candidateIndex`,
      detail:
        `order ${current.order} points at candidate ${current.candidateIndex}, which is not after `
        + `order ${previous.order}'s candidate ${previous.candidateIndex}`,
      fix: "Sections run top to bottom; candidate indices are sorted top to bottom too, so they must increase.",
    });
  }

  return errors;
}
