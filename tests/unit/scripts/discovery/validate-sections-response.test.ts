import { describe, expect, it } from "vitest";

import { validateSectionsResponse } from "../../../../src/scripts/discovery/steps/sections/utils/validate-sections-response.ts";

const ANCHOR = { selector: "section", matchCount: 1 } as const;

const OK = {
  route: "/about",
  globals: [
    { order: 0, role: "header", summary: "logo and nav", anchor: ANCHOR },
    { order: 4, role: "footer", summary: "links and copyright", anchor: ANCHOR },
  ],
  blocks: [
    { order: 1, role: "hero", summary: "title and subtitle", anchor: ANCHOR },
    { order: 2, role: "team-grid", summary: "portraits", anchor: ANCHOR },
    { order: 3, role: "cta", summary: "call to action", anchor: ANCHOR },
  ],
};

function codes(response: unknown): string[] {
  return validateSectionsResponse({ response: response as typeof OK, requestedRoute: "/about" }).map((e) => e.code);
}

describe("validateSectionsResponse", () => {
  it("accepts a well-formed response", () => {
    expect(codes(OK)).toEqual([]);
  });

  it("rejects a route that is not the requested one", () => {
    expect(codes({ ...OK, route: "/contact" })).toContain("ROUTE_MISMATCH");
  });

  it("rejects duplicate order values", () => {
    const broken = { ...OK, blocks: [{ order: 1, role: "hero", summary: "a", anchor: ANCHOR }, { order: 1, role: "cta", summary: "b", anchor: ANCHOR }] };
    expect(codes(broken)).toContain("DUPLICATE_ORDER");
  });

  it("rejects a gap in the order sequence", () => {
    const broken = { ...OK, blocks: [{ order: 1, role: "hero", summary: "a", anchor: ANCHOR }, { order: 3, role: "cta", summary: "b", anchor: ANCHOR }] };
    expect(codes(broken)).toContain("ORDER_NOT_CONTIGUOUS");
  });

  it("rejects an order sequence that does not start at zero", () => {
    const broken = { route: "/about", globals: [], blocks: [{ order: 1, role: "hero", summary: "a", anchor: ANCHOR }] };
    expect(codes(broken)).toContain("ORDER_NOT_CONTIGUOUS");
  });
});
