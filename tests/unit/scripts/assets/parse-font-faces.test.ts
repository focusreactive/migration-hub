import { describe, expect, it } from "vitest";

import type { FetchClient, FetchResponse } from "../../../../src/lib/fetch/create-fetch-client/index.ts";
import {
  buildFontFamilies,
  fetchProviderFontFaces,
  parseFontFaces,
} from "../../../../src/scripts/assets/steps/fonts/parse-font-faces.ts";

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

function fakeClient(status: number, body: string): FetchClient {
  return {
    fetch: () =>
      Promise.resolve({
        status,
        finalUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;700",
        redirectChain: [],
        headers: {},
        body: Buffer.from(body, "utf8"),
      } satisfies FetchResponse),
    setCrawlDelayMs: () => undefined,
  };
}

const PROVIDER_CSS = `
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/inter/v1/inter-400.woff2) format('woff2');
}
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 700;
  src: url(https://fonts.gstatic.com/s/inter/v1/inter-700.woff2) format('woff2');
}`;

describe("fetchProviderFontFaces", () => {
  it("parses the family and weights out of a fetched provider stylesheet", async () => {
    const client = fakeClient(200, PROVIDER_CSS);
    const faces = await fetchProviderFontFaces(client, ["https://fonts.googleapis.com/css2?family=Inter:wght@400;700"]);
    const families = buildFontFamilies(faces, ["fonts.googleapis.com"]);

    expect(families).toHaveLength(1);
    expect(families[0]?.family).toBe("Inter");
    expect(families[0]?.weights).toEqual(["400", "700"]);
  });

  it("skips a provider url that responds with an error status", async () => {
    const client = fakeClient(500, PROVIDER_CSS);
    const faces = await fetchProviderFontFaces(client, ["https://fonts.googleapis.com/css2?family=Inter:wght@400;700"]);

    expect(faces).toHaveLength(0);
  });

  it("skips a provider url when the client throws", async () => {
    const client: FetchClient = {
      fetch: () => Promise.reject(new Error("network error")),
      setCrawlDelayMs: () => undefined,
    };

    await expect(fetchProviderFontFaces(client, ["https://fonts.googleapis.com/css2?family=Inter"])).resolves.toEqual(
      [],
    );
  });
});
