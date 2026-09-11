import { describe, expect, it } from "vitest";

import { foldBlockTypes, foldTypes, mintTypeId } from "../../../../src/scripts/discovery/steps/dedup/utils/fold-types.ts";

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

describe("foldBlockTypes", () => {
  const exemplarRoutes = new Set(["/blog/a"]);

  it("marks a group built only from page-builder members as a block", () => {
    const groups = [
      {
        kind: "block" as const,
        name: "Hero",
        role: "hero",
        members: [{ route: "/", order: 1 }, { route: "/about", order: 1 }],
        exemplar: { route: "/", order: 1 },
      },
    ];

    expect(foldBlockTypes(groups, [], exemplarRoutes)[0]?.kinds).toEqual(["block"]);
  });

  it("marks a group built only from collection-exemplar members as a collectionSection", () => {
    const groups = [
      {
        kind: "block" as const,
        name: "Byline",
        role: "byline",
        members: [{ route: "/blog/a", order: 1 }],
        exemplar: { route: "/blog/a", order: 1 },
      },
    ];

    expect(foldBlockTypes(groups, [], exemplarRoutes)[0]?.kinds).toEqual(["collectionSection"]);
  });

  it("marks a group merged across a page-builder page and a collection exemplar as both", () => {
    const groups = [
      {
        kind: "block" as const,
        name: "CTA panel",
        role: "cta",
        members: [{ route: "/about", order: 5 }, { route: "/blog/a", order: 5 }],
        exemplar: { route: "/about", order: 5 },
      },
    ];

    expect(foldBlockTypes(groups, [], exemplarRoutes)[0]?.kinds).toEqual(["block", "collectionSection"]);
  });
});
