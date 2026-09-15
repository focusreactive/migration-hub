import { describe, expect, it } from "vitest";

import type { Section } from "../../../../src/ir/discovery.ts";
import { planCaptures } from "../../../../src/scripts/crops/utils/crop-index.ts";

const TARGETS = [
  { typeId: "site-header", name: "Site header", route: "/", order: 0, isGlobal: true },
  { typeId: "hero", name: "Hero", route: "/", order: 1, isGlobal: false },
  { typeId: "logos", name: "Logo strip", route: "/", order: 2, isGlobal: false },
];

function section(order: number, anchor: Section["anchor"]): Section {
  return { order, role: `role-${order}`, summary: `summary ${order}`, anchor };
}

const HEADER_ANCHOR = {
  selector: "header.nav",
  matchCount: 1,
  y: 0,
  height: 60,
  tag: "header",
  classes: ["nav"],
  isFixed: true,
  signature: "header.nav|60|",
};

const HERO_ANCHOR = {
  selector: "section.hero",
  matchCount: 1,
  y: 60,
  height: 400,
  tag: "section",
  classes: ["hero"],
  isFixed: false,
  signature: "section.hero|400|Hero band",
};

describe("planCaptures", () => {
  it("turns each anchored target into a request carrying the stored selector and signature", () => {
    const { requests, missing } = planCaptures({
      targets: TARGETS.slice(0, 2),
      sections: [section(0, HEADER_ANCHOR), section(1, HERO_ANCHOR)],
      route: "/",
    });

    expect(missing).toEqual([]);
    expect(requests).toEqual([
      { typeId: "site-header", selector: "header.nav", signature: "header.nav|60|", isFixed: true },
      { typeId: "hero", selector: "section.hero", signature: "section.hero|400|Hero band", isFixed: false },
    ]);
  });

  it("records a target whose section declared it has no element", () => {
    const { requests, missing } = planCaptures({
      targets: TARGETS.slice(0, 2),
      sections: [section(0, HEADER_ANCHOR), section(1, null)],
      route: "/",
    });

    expect(requests).toHaveLength(1);
    expect(missing).toEqual([{ typeId: "hero", route: "/", order: 1, reason: "NO_ELEMENT" }]);
  });

  it("treats an order the shard never mentions as a section with no element", () => {
    const { requests, missing } = planCaptures({
      targets: TARGETS,
      sections: [section(0, HEADER_ANCHOR)],
      route: "/",
    });

    expect(requests).toHaveLength(1);
    expect(missing).toEqual([
      { typeId: "hero", route: "/", order: 1, reason: "NO_ELEMENT" },
      { typeId: "logos", route: "/", order: 2, reason: "NO_ELEMENT" },
    ]);
  });

  it("records every target on a route with no sections shard", () => {
    const { requests, missing } = planCaptures({ targets: TARGETS, sections: undefined, route: "/" });

    expect(requests).toEqual([]);
    expect(missing.map((miss) => miss.reason)).toEqual([
      "SECTIONS_SHARD_MISSING",
      "SECTIONS_SHARD_MISSING",
      "SECTIONS_SHARD_MISSING",
    ]);
  });
});
