import { describe, expect, it } from "vitest";

import { assessRisks } from "../../../../../src/scripts/report/analysis/risks.ts";
import { computeMetrics } from "../../../../../src/scripts/report/analysis/metrics.ts";
import { reportInput } from "../fixtures/report-input.ts";

function idsFor(input = reportInput()) {
  return assessRisks(input, computeMetrics(input)).map((risk) => risk.id);
}

function riskFor(input: ReturnType<typeof reportInput>, id: string) {
  return assessRisks(input, computeMetrics(input)).find((candidate) => candidate.id === id);
}

function singleOfEverything() {
  return reportInput({
    pages: { pages: [{ route: "/", kind: "static" }], collections: [] },
    media: {
      assets: [
        { assetId: "a".repeat(16), canonicalUrl: "https://cdn.example.com/a.webp", kind: "image", contentType: "image/webp", etag: "e1", sources: ["img-src"], duplicateOf: null },
      ],
    },
    blocks: {
      types: [
        { id: "hero", name: "Hero", role: "hero", instanceCount: 1, members: [{ route: "/", order: 1 }], exemplar: { route: "/", order: 1 }, kinds: ["block"] },
        { id: "cta", name: "CTA", role: "cta", instanceCount: 1, members: [{ route: "/style-guide", order: 1 }], exemplar: { route: "/style-guide", order: 1 }, kinds: ["block", "collectionSection"] },
      ],
    },
  });
}

describe("assessRisks", () => {
  it("always reports the redirect map and the inferred field model", () => {
    expect(idsFor()).toContain("redirects");
    expect(idsFor()).toContain("inferredFields");
  });

  it("reports platform-handled forms and names the platform", () => {
    const input = reportInput();
    const risk = assessRisks(input, computeMetrics(input)).find((candidate) => candidate.id === "forms");

    expect(risk?.title).toContain("Form submissions");
    expect(risk?.body).toContain("Webflow");
    expect(risk?.body).toContain("*Plan for:*");
  });

  it("drops the forms risk when every form posts to its own endpoint", () => {
    const input = reportInput({
      forms: {
        forms: [
          { route: "/contact", name: "Contact", action: "https://hooks.example.com/x", method: "post", fieldCount: 1, fields: [] },
        ],
      },
    });

    expect(idsFor(input)).not.toContain("forms");
  });

  it("drops the alt-text risk when images are described", () => {
    const input = reportInput();
    input.media.assets = input.media.assets.map((asset) => ({ ...asset, alt: "described" }));

    expect(idsFor(input)).not.toContain("altText");
  });

  it("drops the inferred field model risk on a site with no collections", () => {
    const input = reportInput({ pages: { pages: [{ route: "/", kind: "static" }], collections: [] } });

    expect(idsFor(input)).not.toContain("inferredFields");
  });

  it("drops the asset hosting risk when no asset canonical URL resolves to a host", () => {
    const input = reportInput({
      media: {
        assets: [
          { assetId: "a".repeat(16), canonicalUrl: "not-a-valid-url", kind: "image", contentType: "image/webp", etag: "e1", sources: ["img-src"], alt: "Team", duplicateOf: null },
          { assetId: "b".repeat(16), canonicalUrl: "also-not-a-valid-url", kind: "image", contentType: "image/webp", etag: "e2", sources: ["img-src"], alt: "Team", duplicateOf: null },
        ],
      },
    });

    expect(idsFor(input)).not.toContain("assetHosting");
  });

  it("drops the utility sections risk when no section type is utility-only", () => {
    const input = reportInput({
      blocks: {
        types: [
          { id: "hero", name: "Hero", role: "hero", instanceCount: 2, members: [{ route: "/", order: 1 }, { route: "/about", order: 1 }], exemplar: { route: "/", order: 1 }, kinds: ["block"] },
          { id: "cta", name: "CTA", role: "cta", instanceCount: 2, members: [{ route: "/about", order: 5 }, { route: "/journal/a", order: 5 }], exemplar: { route: "/about", order: 5 }, kinds: ["block", "collectionSection"] },
          { id: "body", name: "Journal body", role: "journal-body", instanceCount: 1, members: [{ route: "/journal/a", order: 2 }], exemplar: { route: "/journal/a", order: 2 }, kinds: ["collectionSection"] },
        ],
      },
    });

    expect(idsFor(input)).not.toContain("utilitySections");
  });

  it("drops the dual-source sections risk when no section type serves both kinds", () => {
    const input = reportInput({
      blocks: {
        types: [
          { id: "hero", name: "Hero", role: "hero", instanceCount: 2, members: [{ route: "/", order: 1 }, { route: "/about", order: 1 }], exemplar: { route: "/", order: 1 }, kinds: ["block"] },
          { id: "body", name: "Journal body", role: "journal-body", instanceCount: 1, members: [{ route: "/journal/a", order: 2 }], exemplar: { route: "/journal/a", order: 2 }, kinds: ["collectionSection"] },
          { id: "type", name: "Typography specimen", role: "typography-specimen", instanceCount: 1, members: [{ route: "/utility-pages/style-guide", order: 1 }], exemplar: { route: "/utility-pages/style-guide", order: 1 }, kinds: ["block"] },
        ],
      },
    });

    expect(idsFor(input)).not.toContain("dualSourceSections");
  });

  it("drops the interactions risk when no block type has a motion role", () => {
    expect(idsFor()).not.toContain("interactions");
  });

  it("reports asset hosting and names the real hosts the assets are served from", () => {
    const input = reportInput();
    input.media.assets = [
      ...input.media.assets,
      { assetId: "d".repeat(16), canonicalUrl: "https://assets.example.org/d.webp", kind: "image", contentType: "image/webp", etag: "e4", sources: ["img-src"], alt: "Logo", duplicateOf: null },
    ];
    const risk = riskFor(input, "assetHosting");

    expect(risk?.title).toBe("Every image lives on the platform's CDN.");
    expect(risk?.body).toContain("All 3 images are served from assets.example.org, cdn.example.com.");
    expect(risk?.body).toContain("*Plan for:*");
  });

  it("reports the alt-text debt with both counts and a verb that agrees with them", () => {
    const risk = riskFor(reportInput(), "altText");

    expect(risk?.title).toBe("One of 2 images has no alt text.");
    expect(risk?.body).toContain("accessibility and SEO debt");
  });

  it("reports utility-only section types against the full section-type count", () => {
    const risk = riskFor(reportInput(), "utilitySections");

    expect(risk?.title).toBe("One of the 4 section types exists only for the platform's own utility pages.");
    expect(risk?.body).toContain("*Plan for:* an early decision to drop them");
  });

  it("reports dual-source section types with their count", () => {
    const risk = riskFor(reportInput(), "dualSourceSections");

    expect(risk?.title).toBe("One section is used in two different ways.");
    expect(risk?.body).toContain("page-builder blocks and inside collection templates");
  });

  it("reports interactions and names the platform when a block carries a motion role", () => {
    const input = reportInput({
      blocks: {
        types: [
          { id: "carousel", name: "Related items carousel", role: "related-items-carousel", instanceCount: 2, members: [{ route: "/", order: 1 }, { route: "/about", order: 1 }], exemplar: { route: "/", order: 1 }, kinds: ["block"] },
        ],
      },
    });
    const risk = riskFor(input, "interactions");

    expect(risk?.title).toBe("Interactive behaviour is not visible to static analysis.");
    expect(risk?.body).toContain("Webflow interactions");
  });

  it("reports the redirect map with the route count", () => {
    const risk = riskFor(reportInput(), "redirects");

    expect(risk?.title).toBe("5 URLs need a redirect map.");
  });

  it("keeps subject and verb singular when every count is one", () => {
    const input = singleOfEverything();

    expect(riskFor(input, "redirects")?.title).toBe("One URL needs a redirect map.");
    expect(riskFor(input, "utilitySections")?.title).toBe(
      "One of the 2 section types exists only for the platform's own utility pages.",
    );
    expect(riskFor(input, "dualSourceSections")?.title).toBe("One section is used in two different ways.");
    expect(riskFor(input, "altText")?.title).toBe("One of 1 image has no alt text.");
    expect(riskFor(input, "assetHosting")?.body).toContain("The one image is served from cdn.example.com.");
  });

  it("keeps the risks in the declared order", () => {
    const ids = idsFor();
    const ordered = [...ids].sort(
      (a, b) =>
        ["forms", "assetHosting", "altText", "utilitySections", "dualSourceSections", "interactions", "inferredFields", "redirects"].indexOf(a)
        - ["forms", "assetHosting", "altText", "utilitySections", "dualSourceSections", "interactions", "inferredFields", "redirects"].indexOf(b),
    );

    expect(ids).toEqual(ordered);
  });
});
