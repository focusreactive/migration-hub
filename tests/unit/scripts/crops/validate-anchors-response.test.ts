import { describe, expect, it } from "vitest";

import { validateAnchorsResponse } from "../../../../src/scripts/crops/steps/anchors/utils/validate-anchors-response.ts";

const BASE = { requestedRoute: "/about", orders: [0, 1, 2], candidateCount: 5 };

function codes(response: { route: string; anchors: { order: number; candidateIndex: number }[] }): string[] {
  return validateAnchorsResponse({ ...BASE, response }).map((error) => error.code);
}

describe("validateAnchorsResponse", () => {
  it("accepts a complete, monotonic mapping", () => {
    expect(
      codes({
        route: "/about",
        anchors: [
          { order: 0, candidateIndex: 0 },
          { order: 1, candidateIndex: 2 },
          { order: 2, candidateIndex: 4 },
        ],
      }),
    ).toEqual([]);
  });

  it("rejects a response for another route", () => {
    expect(
      codes({
        route: "/contact",
        anchors: [
          { order: 0, candidateIndex: 0 },
          { order: 1, candidateIndex: 1 },
          { order: 2, candidateIndex: 2 },
        ],
      }),
    ).toContain("ROUTE_MISMATCH");
  });

  it("rejects an order the route does not have", () => {
    expect(
      codes({
        route: "/about",
        anchors: [
          { order: 0, candidateIndex: 0 },
          { order: 1, candidateIndex: 1 },
          { order: 2, candidateIndex: 2 },
          { order: 9, candidateIndex: 3 },
        ],
      }),
    ).toContain("UNKNOWN_ORDER");
  });

  it("rejects a section left unmapped", () => {
    expect(
      codes({
        route: "/about",
        anchors: [
          { order: 0, candidateIndex: 0 },
          { order: 1, candidateIndex: 1 },
        ],
      }),
    ).toContain("MISSING_ORDER");
  });

  it("rejects a duplicated order", () => {
    expect(
      codes({
        route: "/about",
        anchors: [
          { order: 0, candidateIndex: 0 },
          { order: 0, candidateIndex: 1 },
          { order: 1, candidateIndex: 2 },
          { order: 2, candidateIndex: 3 },
        ],
      }),
    ).toContain("DUPLICATE_ORDER");
  });

  it("rejects a candidate index past the end of the list", () => {
    expect(
      codes({
        route: "/about",
        anchors: [
          { order: 0, candidateIndex: 0 },
          { order: 1, candidateIndex: 1 },
          { order: 2, candidateIndex: 5 },
        ],
      }),
    ).toContain("CANDIDATE_OUT_OF_RANGE");
  });

  it("rejects two orders pointing at one candidate", () => {
    expect(
      codes({
        route: "/about",
        anchors: [
          { order: 0, candidateIndex: 0 },
          { order: 1, candidateIndex: 1 },
          { order: 2, candidateIndex: 1 },
        ],
      }),
    ).toContain("DUPLICATE_CANDIDATE");
  });

  it("rejects a mapping that runs backwards", () => {
    expect(
      codes({
        route: "/about",
        anchors: [
          { order: 0, candidateIndex: 3 },
          { order: 1, candidateIndex: 1 },
          { order: 2, candidateIndex: 4 },
        ],
      }),
    ).toContain("NOT_MONOTONIC");
  });

  it("reports every problem in one pass", () => {
    const errors = codes({ route: "/contact", anchors: [{ order: 7, candidateIndex: 99 }] });

    expect(errors).toEqual(
      expect.arrayContaining(["ROUTE_MISMATCH", "UNKNOWN_ORDER", "MISSING_ORDER", "CANDIDATE_OUT_OF_RANGE"]),
    );
  });
});
