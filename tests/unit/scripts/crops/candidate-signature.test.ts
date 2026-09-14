import { describe, expect, it } from "vitest";

import { candidateSignature } from "../../../../src/scripts/crops/utils/candidate-signature.ts";

describe("candidateSignature", () => {
  it("joins tag, classes, rounded height and a clipped text snippet", () => {
    expect(
      candidateSignature({ tag: "section", classes: ["hero", "is-dark"], height: 412.4, textSnippet: "Build faster" }),
    ).toBe("section.hero.is-dark|412|Build faster");
  });

  it("keeps at most six classes", () => {
    const signature = candidateSignature({
      tag: "div",
      classes: ["a", "b", "c", "d", "e", "f", "g", "h"],
      height: 100,
      textSnippet: "",
    });

    expect(signature).toBe("div.a.b.c.d.e.f|100|");
  });

  it("clips the text snippet to 48 characters", () => {
    const signature = candidateSignature({ tag: "p", classes: [], height: 30, textSnippet: "x".repeat(200) });

    expect(signature).toBe(`p|30|${"x".repeat(48)}`);
  });

  it("is stable across sub-pixel height jitter", () => {
    const a = candidateSignature({ tag: "footer", classes: [], height: 199.6, textSnippet: "Contact" });
    const b = candidateSignature({ tag: "footer", classes: [], height: 200.2, textSnippet: "Contact" });

    expect(a).toBe(b);
  });
});
