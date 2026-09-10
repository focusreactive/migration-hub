import { describe, expect, it } from "vitest";

import { foldTypes, mintTypeId } from "../../../../src/scripts/discovery/steps/dedup/utils/fold-types.ts";

describe("mintTypeId", () => {
  it("slugs the role", () => {
    expect(mintTypeId("Feature Grid", new Set())).toBe("feature-grid");
  });

  it("suffixes a colliding id", () => {
    const used = new Set(["cta"]);
    expect(mintTypeId("cta", used)).toBe("cta-2");
  });
});

describe("foldTypes", () => {
  const groups = [
    {
      kind: "block" as const,
      name: "Hero",
      role: "hero",
      members: [
        { route: "/", order: 1 },
        { route: "/about", order: 1 },
      ],
      exemplar: { route: "/", order: 1 },
    },
    {
      kind: "block" as const,
      name: "Team Grid",
      role: "team-grid",
      members: [{ route: "/about", order: 2 }],
      exemplar: { route: "/about", order: 2 },
    },
  ];

  it("mints an id per group and counts its instances", () => {
    const types = foldTypes(groups, []);

    expect(types.map((type) => type.id)).toEqual(["hero", "team-grid"]);
    expect(types[0]?.instanceCount).toBe(2);
  });

  it("carries the members through unchanged", () => {
    const types = foldTypes(groups, []);
    expect(types[0]?.members).toEqual([
      { route: "/", order: 1 },
      { route: "/about", order: 1 },
    ]);
  });
});
