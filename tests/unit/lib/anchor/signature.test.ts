import { describe, expect, it } from "vitest";

import { anchorNodeSignature, anchorSignature } from "../../../../src/lib/anchor/signature.ts";

describe("anchorNodeSignature", () => {
  it("joins tag, leading classes, rounded height and clipped text", () => {
    expect(anchorNodeSignature({ tag: "section", classes: ["hero", "band"], height: 400.4, textSnippet: "Hero" })).toBe(
      "section.hero.band|400|Hero",
    );
  });

  it("falls back to the bare tag when the element has no classes", () => {
    expect(anchorNodeSignature({ tag: "footer", classes: [], height: 200, textSnippet: "" })).toBe("footer|200|");
  });

  it("keeps only the leading classes, so a utility-class pile cannot dominate", () => {
    const classes = ["a", "b", "c", "d", "e", "f", "g", "h"];
    expect(anchorNodeSignature({ tag: "div", classes, height: 10, textSnippet: "" })).toBe("div.a.b.c.d.e.f|10|");
  });
});

describe("anchorSignature", () => {
  it("is the single node's signature for a one-element anchor", () => {
    expect(anchorSignature([{ signature: "section.hero|400|Hero" }])).toBe("section.hero|400|Hero");
  });

  it("chains every member of a multi-node anchor in order", () => {
    expect(anchorSignature([{ signature: "h2|40|Text Sizes" }, { signature: "div.list|300|Large" }])).toBe(
      "h2|40|Text Sizes~div.list|300|Large",
    );
  });

  it("changes when a member is lost, so drift is detectable", () => {
    const before = anchorSignature([{ signature: "h2|40|A" }, { signature: "div|300|B" }]);
    const after = anchorSignature([{ signature: "h2|40|A" }]);
    expect(after).not.toBe(before);
  });
});
