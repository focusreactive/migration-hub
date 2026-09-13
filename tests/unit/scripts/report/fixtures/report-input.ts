import type { ReportInput } from "../../../../../src/scripts/report/types.ts";

export function reportInput(overrides: Partial<ReportInput> = {}): ReportInput {
  return {
    sourceUrl: "https://example.webflow.io/",
    verdict: "webflow",
    narrative: { site: "Example is a marketing site.", design: "The design is quiet." },
    pages: {
      pages: [
        { route: "/", kind: "static" },
        { route: "/about", kind: "static" },
        { route: "/utility-pages/style-guide", kind: "static" },
        { route: "/journal/a", kind: "item", collectionKey: "k1" },
        { route: "/journal/b", kind: "item", collectionKey: "k1" },
      ],
      collections: [{ key: "k1", routePattern: "/journal/:slug", itemCount: 2 }],
    },
    media: {
      assets: [
        { assetId: "a".repeat(16), canonicalUrl: "https://cdn.example.com/a.webp", kind: "image", contentType: "image/webp", etag: "e1", sources: ["img-src"], alt: "Team", duplicateOf: null },
        { assetId: "b".repeat(16), canonicalUrl: "https://cdn.example.com/b.webp", kind: "image", contentType: "image/webp", etag: "e2", sources: ["img-src"], duplicateOf: null },
        { assetId: "c".repeat(16), canonicalUrl: "https://cdn.example.com/c.webp", kind: "image", contentType: "image/webp", etag: "e1", sources: ["img-src"], duplicateOf: "a".repeat(16) },
      ],
    },
    fonts: { families: [{ family: "Inter", weights: ["400"], styles: ["normal"], classification: "google", sources: ["font-face"] }] },
    forms: {
      forms: [{ route: "/contact", name: "Contact", action: null, method: "post", fieldCount: 1, fields: [{ name: "Email", type: "email", required: true }] }],
    },
    blocks: {
      types: [
        { id: "hero", name: "Hero", role: "hero", instanceCount: 2, members: [{ route: "/", order: 1 }, { route: "/about", order: 1 }], exemplar: { route: "/", order: 1 }, kinds: ["block"] },
        { id: "cta", name: "CTA", role: "cta", instanceCount: 2, members: [{ route: "/about", order: 5 }, { route: "/journal/a", order: 5 }], exemplar: { route: "/about", order: 5 }, kinds: ["block", "collectionSection"] },
        { id: "body", name: "Journal body", role: "journal-body", instanceCount: 1, members: [{ route: "/journal/a", order: 2 }], exemplar: { route: "/journal/a", order: 2 }, kinds: ["collectionSection"] },
        { id: "type", name: "Typography specimen", role: "typography-specimen", instanceCount: 1, members: [{ route: "/utility-pages/style-guide", order: 1 }], exemplar: { route: "/utility-pages/style-guide", order: 1 }, kinds: ["block"] },
      ],
    },
    globals: {
      types: [{ id: "header", name: "Header", role: "header", instanceCount: 3, members: [{ route: "/", order: 0 }, { route: "/about", order: 0 }, { route: "/journal/a", order: 0 }], exemplar: { route: "/", order: 0 } }],
    },
    ...overrides,
  };
}
