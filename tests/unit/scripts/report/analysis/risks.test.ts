import { describe, expect, it } from "vitest";

import { assessRisks } from "../../../../../src/scripts/report/analysis/risks.ts";
import { computeMetrics } from "../../../../../src/scripts/report/analysis/metrics.ts";
import { reportInput } from "../fixtures/report-input.ts";

function idsFor(input = reportInput()) {
  return assessRisks(input, computeMetrics(input)).map((risk) => risk.id);
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
