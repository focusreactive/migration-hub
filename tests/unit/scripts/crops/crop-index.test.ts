import { describe, expect, it } from "vitest";

import { planCaptures } from "../../../../src/scripts/crops/utils/crop-index.ts";

const TARGETS = [
  { typeId: "site-header", name: "Site header", route: "/", order: 0, isGlobal: true },
  { typeId: "hero", name: "Hero", route: "/", order: 1, isGlobal: false },
  { typeId: "logos", name: "Logo strip", route: "/", order: 2, isGlobal: false },
];

const CANDIDATES = [
  { index: 0, y: 0, height: 60, tag: "header", classes: [], textSnippet: "", isFixed: true, signature: "header|60|" },
  { index: 1, y: 60, height: 400, tag: "section", classes: [], textSnippet: "", isFixed: false, signature: "s|400|" },
];

describe("planCaptures", () => {
  it("turns each anchored target into a request carrying the stored signature", () => {
    const { requests, missing } = planCaptures({
      targets: TARGETS.slice(0, 2),
      anchors: [
        { order: 0, candidateIndex: 0 },
        { order: 1, candidateIndex: 1 },
      ],
      candidates: CANDIDATES,
      route: "/",
    });

    expect(missing).toEqual([]);
    expect(requests).toEqual([
      { typeId: "site-header", candidateIndex: 0, signature: "header|60|" },
      { typeId: "hero", candidateIndex: 1, signature: "s|400|" },
    ]);
  });

  it("records a target whose order has no anchor", () => {
    const { requests, missing } = planCaptures({
      targets: TARGETS,
      anchors: [{ order: 0, candidateIndex: 0 }],
      candidates: CANDIDATES,
      route: "/",
    });

    expect(requests).toHaveLength(1);
    expect(missing).toEqual([
      { typeId: "hero", route: "/", order: 1, reason: "NO_ANCHOR_FOR_ORDER" },
      { typeId: "logos", route: "/", order: 2, reason: "NO_ANCHOR_FOR_ORDER" },
    ]);
  });

  it("records a target whose candidate index no longer exists", () => {
    const { requests, missing } = planCaptures({
      targets: TARGETS.slice(0, 1),
      anchors: [{ order: 0, candidateIndex: 7 }],
      candidates: CANDIDATES,
      route: "/",
    });

    expect(requests).toEqual([]);
    expect(missing).toEqual([{ typeId: "site-header", route: "/", order: 0, reason: "CANDIDATE_OUT_OF_RANGE" }]);
  });

  it("records every target on a route with no anchors shard", () => {
    const { requests, missing } = planCaptures({
      targets: TARGETS,
      anchors: undefined,
      candidates: CANDIDATES,
      route: "/",
    });

    expect(requests).toEqual([]);
    expect(missing.map((miss) => miss.reason)).toEqual(["NO_ANCHORS_SHARD", "NO_ANCHORS_SHARD", "NO_ANCHORS_SHARD"]);
  });
});
