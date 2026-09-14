import { describe, expect, it } from "vitest";

import type { CropCandidate } from "../../../../src/ir/crops.ts";
import { validateAnchorsResponse } from "../../../../src/scripts/crops/steps/anchors/utils/validate-anchors-response.ts";

function candidate(index: number, isFixed = false): CropCandidate {
  return {
    index,
    y: index * 100,
    height: 100,
    tag: "section",
    classes: [],
    textSnippet: "",
    isFixed,
    signature: `sig-${index}`,
  };
}

function unpinnedCandidates(count: number, pinned: number[] = []): CropCandidate[] {
  return Array.from({ length: count }, (_, index) => candidate(index, pinned.includes(index)));
}

const BASE = { requestedRoute: "/about", orders: [0, 1, 2], candidates: unpinnedCandidates(5) };

function codes(
  response: { route: string; anchors: { order: number; candidateIndex: number }[]; unmappable?: number[] },
  candidates: CropCandidate[] = BASE.candidates,
): string[] {
  return validateAnchorsResponse({ ...BASE, response, candidates }).map((error) => error.code);
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

  it("accepts a section declared unmappable in place of an anchor", () => {
    expect(
      codes({
        route: "/about",
        anchors: [
          { order: 0, candidateIndex: 0 },
          { order: 1, candidateIndex: 2 },
        ],
        unmappable: [2],
      }),
    ).toEqual([]);
  });

  it("rejects an order that is both anchored and declared unmappable", () => {
    expect(
      codes({
        route: "/about",
        anchors: [
          { order: 0, candidateIndex: 0 },
          { order: 1, candidateIndex: 1 },
          { order: 2, candidateIndex: 2 },
        ],
        unmappable: [1],
      }),
    ).toContain("CONTRADICTORY_ORDER");
  });

  it("rejects an unmappable entry for an order the route does not have", () => {
    expect(
      codes({
        route: "/about",
        anchors: [
          { order: 0, candidateIndex: 0 },
          { order: 1, candidateIndex: 1 },
          { order: 2, candidateIndex: 2 },
        ],
        unmappable: [9],
      }),
    ).toContain("UNKNOWN_ORDER");
  });

  it("still enforces monotonicity across the anchored subset when some orders are unmappable", () => {
    const errors = codes({
      route: "/about",
      anchors: [
        { order: 0, candidateIndex: 3 },
        { order: 2, candidateIndex: 1 },
      ],
      unmappable: [1],
    });

    expect(errors).toContain("NOT_MONOTONIC");
    expect(errors).not.toContain("MISSING_ORDER");
  });

  it("accepts a global mapped to a pinned candidate ahead of an in-flow hero (the nova-x shape)", () => {
    expect(
      codes(
        {
          route: "/about",
          anchors: [
            { order: 0, candidateIndex: 1 },
            { order: 1, candidateIndex: 0 },
            { order: 2, candidateIndex: 3 },
          ],
        },
        unpinnedCandidates(4, [1]),
      ),
    ).toEqual([]);
  });

  it("still rejects two unpinned anchors that run backwards", () => {
    expect(
      codes({
        route: "/about",
        anchors: [
          { order: 0, candidateIndex: 3 },
          { order: 1, candidateIndex: 1 },
        ],
      }),
    ).toContain("NOT_MONOTONIC");
  });

  it("accepts out-of-order pinned anchors when every unpinned anchor still increases", () => {
    const errors = validateAnchorsResponse({
      requestedRoute: "/about",
      orders: [0, 1, 2, 3],
      candidates: unpinnedCandidates(4, [2, 3]),
      response: {
        route: "/about",
        anchors: [
          { order: 0, candidateIndex: 3 },
          { order: 1, candidateIndex: 2 },
          { order: 2, candidateIndex: 0 },
          { order: 3, candidateIndex: 1 },
        ],
      },
    });

    expect(errors).toEqual([]);
  });

  it("accepts a page whose every section is declared unmappable with no anchors at all", () => {
    expect(
      codes({
        route: "/about",
        anchors: [],
        unmappable: [0, 1, 2],
      }),
    ).toEqual([]);
  });
});
