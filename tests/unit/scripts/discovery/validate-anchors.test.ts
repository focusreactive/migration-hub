import { describe, expect, it } from "vitest";

import type { ResolveResult, ResolvedNode } from "../../../../src/lib/anchor/page-scripts.ts";
import {
  validateAnchors,
  type AnchorInput,
} from "../../../../src/scripts/discovery/steps/sections/utils/validate-anchors.ts";

const PAGE_HEIGHT = 4000;

function node(overrides: Partial<ResolvedNode> = {}): ResolvedNode {
  return {
    y: 0,
    height: 100,
    tag: "section",
    classes: ["band"],
    textSnippet: "Band",
    isFixed: false,
    signature: "section.band|100|Band",
    ...overrides,
  };
}

function resolved(nodes: ResolvedNode[], y: number, height: number): ResolveResult {
  return {
    status: "ok",
    nodes,
    union: { x: 0, y, width: 1440, height },
    pageHeight: PAGE_HEIGHT,
  };
}

function anchored(order: number, selector: string, y: number, height: number, nodes = [node({ y, height })]): AnchorInput {
  return { order, proposal: { selector, matchCount: nodes.length }, resolution: resolved(nodes, y, height) };
}

function codes(inputs: AnchorInput[]): string[] {
  return validateAnchors(inputs).errors.map((error) => error.code);
}

describe("validateAnchors", () => {
  it("resolves geometry and signature from the page, not from the response", () => {
    const { errors, anchors } = validateAnchors([
      anchored(0, "section.hero", 60, 400, [node({ y: 60, height: 400, signature: "section.hero|400|Hero" })]),
    ]);

    expect(errors).toEqual([]);
    expect(anchors.get(0)).toMatchObject({
      selector: "section.hero",
      matchCount: 1,
      y: 60,
      height: 400,
      tag: "section",
      isFixed: false,
      signature: "section.hero|400|Hero",
    });
  });

  it("stores a null anchor for a section that declared it has no element", () => {
    const { errors, anchors } = validateAnchors([{ order: 3, proposal: { noElement: true }, resolution: undefined }]);

    expect(errors).toEqual([]);
    expect(anchors.get(3)).toBeNull();
  });

  it("chains the signatures of a contiguous run of siblings", () => {
    const nodes = [
      node({ y: 100, height: 40, signature: "h2|40|Text Sizes" }),
      node({ y: 140, height: 300, signature: "div.list|300|Large" }),
    ];
    const { anchors } = validateAnchors([anchored(0, ".sg > *", 100, 340, nodes)]);

    expect(anchors.get(0)).toMatchObject({ matchCount: 2, signature: "h2|40|Text Sizes~div.list|300|Large" });
  });

  it.each([
    ["INVALID", "SELECTOR_INVALID"],
    ["NO_MATCH", "SELECTOR_NO_MATCH"],
    ["NOT_CONTIGUOUS", "SELECTOR_NOT_CONTIGUOUS"],
  ] as const)("reports %s as %s", (status, code) => {
    const input: AnchorInput = {
      order: 0,
      proposal: { selector: "??", matchCount: 1 },
      resolution: { status, nodes: [], union: null, pageHeight: PAGE_HEIGHT },
    };

    expect(codes([input])).toEqual([code]);
  });

  it("reports a browser that could not be queried at all as an invalid selector", () => {
    const input: AnchorInput = { order: 0, proposal: { selector: "section", matchCount: 1 }, resolution: undefined };

    expect(codes([input])).toEqual(["SELECTOR_INVALID"]);
  });

  it("rejects a matchCount that does not describe what the selector matches", () => {
    const input: AnchorInput = {
      order: 0,
      proposal: { selector: "section", matchCount: 3 },
      resolution: resolved([node(), node()], 0, 200),
    };

    expect(codes([input])).toEqual(["SELECTOR_COUNT_MISMATCH"]);
  });

  it("rejects an anchor whose box contains another section's box", () => {
    const wrapper = anchored(0, "div.wrapper", 0, 3000);
    const inside = anchored(1, "section.hero", 100, 400);

    expect(codes([wrapper, inside])).toContain("ANCHOR_SWALLOWS_SECTION");
  });

  it("rejects a later section anchored above an earlier one", () => {
    const first = anchored(0, "section.a", 900, 100);
    const second = anchored(1, "section.b", 100, 100);

    expect(codes([first, second])).toContain("ANCHOR_NOT_MONOTONIC");
  });

  it("rejects a single band that covers most of a page split into many", () => {
    const inputs = [
      anchored(0, "div.styleguide-elements", 0, 2600),
      anchored(1, "section.b", 2700, 100),
      anchored(2, "section.c", 2900, 100),
      anchored(3, "section.d", 3100, 100),
    ];

    expect(codes(inputs)).toContain("ANCHOR_COVERS_PAGE");
  });

  it("leaves a tall band alone on a page with only a few sections", () => {
    const inputs = [anchored(0, "section.a", 0, 2600), anchored(1, "section.b", 2700, 100)];

    expect(codes(inputs)).not.toContain("ANCHOR_COVERS_PAGE");
  });

  it("exempts a pinned anchor from ordering and containment, since its box is in viewport space", () => {
    const header: AnchorInput = {
      order: 0,
      proposal: { selector: "div.navbar", matchCount: 1 },
      resolution: resolved([node({ isFixed: true, y: 24, height: 60 })], 24, 60),
    };
    const hero = anchored(1, "section.hero", 0, 800);

    expect(codes([header, hero])).toEqual([]);
  });
});
