import type { SectionsResponse } from "../../../schemas/sections-response.ts";
import type { AcceptError } from "../../../types.ts";

export function validateSectionsResponse(args: {
  response: SectionsResponse;
  requestedRoute: string;
}): AcceptError[] {
  const errors: AcceptError[] = [];

  if (args.response.route !== args.requestedRoute) {
    errors.push({
      code: "ROUTE_MISMATCH",
      where: "route",
      got: args.response.route,
      detail: `The subject was served for ${args.requestedRoute}.`,
      fix: `Set route to "${args.requestedRoute}".`,
    });
  }

  const orders = [...args.response.globals, ...args.response.blocks].map((section) => section.order);
  const seen = new Set<number>();
  for (const order of orders) {
    if (seen.has(order)) {
      errors.push({
        code: "DUPLICATE_ORDER",
        where: "order",
        got: String(order),
        detail: "Two sections claim the same position on the page.",
        fix: "Number every section once, top to bottom, starting at 0.",
      });
    }
    seen.add(order);
  }

  const sorted = [...seen].sort((a, b) => a - b);
  const contiguous = sorted.every((order, index) => order === index);
  if (!contiguous) {
    errors.push({
      code: "ORDER_NOT_CONTIGUOUS",
      where: "order",
      got: sorted.join(","),
      detail: "Section positions must run 0, 1, 2 … with no gaps, across globals and blocks together.",
      fix: "Renumber every section top to bottom starting at 0.",
    });
  }

  return errors;
}
