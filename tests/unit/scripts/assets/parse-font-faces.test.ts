import { describe, expect, it } from "vitest";

import { buildFontFamilies, parseFontFaces } from "../../../../src/scripts/assets/steps/fonts/parse-font-faces.ts";

const CSS = `
@font-face {
  font-family: "Fragment Mono";
  src: url("/fonts/fragment-400.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
}
@font-face {
  font-family: "Fragment Mono";
  src: url("/fonts/fragment-400i.woff2") format("woff2");
  font-weight: 400;
  font-style: italic;
}
@font-face {
  font-family: "Inter";
  src: url("https://fonts.gstatic.com/s/inter/inter-700.woff2") format("woff2");
  font-weight: 700;
}`;

describe("parseFontFaces", () => {
  it("returns one face per @font-face rule", () => {
    expect(parseFontFaces(CSS, "https://example.com/site.css")).toHaveLength(3);
  });

  it("resolves a relative binary url against the stylesheet", () => {
    const faces = parseFontFaces(CSS, "https://example.com/assets/site.css");
    expect(faces[0]?.binaryUrl).toBe("https://example.com/fonts/fragment-400.woff2");
  });
});

describe("buildFontFamilies", () => {
  it("folds faces into one record per family", () => {
    const families = buildFontFamilies(parseFontFaces(CSS, "https://example.com/site.css"), []);
    expect(families).toHaveLength(2);
  });

  it("collects the weights and styles of a family", () => {
    const families = buildFontFamilies(parseFontFaces(CSS, "https://example.com/site.css"), []);
    const fragment = families.find((family) => family.family === "Fragment Mono");

    expect(fragment?.weights).toEqual(["400"]);
    expect(fragment?.styles).toEqual(["normal", "italic"]);
  });

  it("classifies a gstatic-hosted family as google", () => {
    const families = buildFontFamilies(parseFontFaces(CSS, "https://example.com/site.css"), []);
    expect(families.find((family) => family.family === "Inter")?.classification).toBe("google");
  });

  it("classifies a self-hosted family as custom", () => {
    const families = buildFontFamilies(parseFontFaces(CSS, "https://example.com/site.css"), []);
    expect(families.find((family) => family.family === "Fragment Mono")?.classification).toBe("custom");
  });
});
