import { describe, expect, it } from "vitest";

import { renderReport, type ReportInput } from "../../../../src/scripts/report/render-report.ts";

const INPUT: ReportInput = {
  sourceUrl: "https://pearlstudio.framer.website/",
  verdict: "framer",
  pages: {
    pages: [
      { route: "/", kind: "static" },
      { route: "/about", kind: "static" },
      { route: "/journal/a", kind: "item", collectionKey: "k1" },
      { route: "/journal/b", kind: "item", collectionKey: "k1" },
    ],
    collections: [{ key: "k1", routePattern: "/journal/:slug", itemCount: 2 }],
  },
  media: {
    assets: [
      { assetId: "a".repeat(16), canonicalUrl: "https://cdn/x.jpg", kind: "image", contentType: "image/jpeg", etag: "e1", sources: ["img-src"], duplicateOf: null },
      { assetId: "b".repeat(16), canonicalUrl: "https://cdn/y.jpg", kind: "image", contentType: "image/jpeg", etag: "e1", sources: ["img-src"], duplicateOf: "a".repeat(16) },
      { assetId: "c".repeat(16), canonicalUrl: "https://cdn/z.mp4", kind: "video", contentType: "video/mp4", etag: null, sources: ["video-urls"], duplicateOf: null },
    ],
  },
  fonts: { families: [{ family: "Inter", weights: ["400"], styles: ["normal"], classification: "google", sources: ["font-face"] }] },
  forms: { forms: [{ route: "/contact", name: "Contact", action: null, method: "post", fieldCount: 3, fields: [] }] },
  blocks: {
    types: [
      { id: "hero", name: "Hero", role: "hero", instanceCount: 2, members: [{ route: "/", order: 1 }, { route: "/about", order: 1 }], exemplar: { route: "/", order: 1 } },
    ],
  },
  globals: {
    types: [
      { id: "header", name: "Header", role: "header", instanceCount: 2, members: [{ route: "/", order: 0 }, { route: "/about", order: 0 }], exemplar: { route: "/", order: 0 } },
    ],
  },
};

describe("renderReport", () => {
  it("names the source cms", () => {
    expect(renderReport(INPUT)).toContain("Framer");
  });

  it("counts every page including collection items", () => {
    expect(renderReport(INPUT)).toMatch(/\| Pages \| 4 \|/);
  });

  it("counts page builder pages as the static ones only", () => {
    expect(renderReport(INPUT)).toMatch(/\| Page builder pages \| 2 \|/);
  });

  it("excludes duplicate media from the image count", () => {
    expect(renderReport(INPUT)).toMatch(/\| Images \| 1 \|/);
  });

  it("names the collection from its route pattern", () => {
    expect(renderReport(INPUT)).toContain("| Journal | /journal/:slug | 2 |");
  });

  it("lists the block types with their instance counts", () => {
    expect(renderReport(INPUT)).toContain("| Hero | 2 |");
  });

  it("lists a platform-handled form as having no endpoint", () => {
    expect(renderReport(INPUT)).toContain("handled by the platform");
  });

  it("links both tools for the detected source", () => {
    const md = renderReport(INPUT);
    expect(md).toContain("https://github.com/focusreactive/framer-to-sanity-migration");
    expect(md).toContain("https://github.com/focusreactive/framer-to-payload-migration");
  });

  it("does not link the tools of the other source", () => {
    expect(renderReport(INPUT)).not.toContain("webflow-to-sanity-migration");
  });
});

describe("renderReport forms deduplication", () => {
  it("counts the same form repeated on three routes as one form listing all three pages", () => {
    const input: ReportInput = {
      ...INPUT,
      forms: {
        forms: [
          { route: "/", name: "Newsletter", action: null, method: "get", fieldCount: 1, fields: [{ name: "Email", type: "email", required: true }] },
          { route: "/about", name: "Newsletter", action: null, method: "get", fieldCount: 1, fields: [{ name: "Email", type: "email", required: true }] },
          { route: "/contact", name: "Newsletter", action: null, method: "get", fieldCount: 1, fields: [{ name: "Email", type: "email", required: true }] },
        ],
      },
    };

    const md = renderReport(input);
    expect(md).toMatch(/\| Forms \| 1 \|/);

    const formsRow = md.split("\n").find((line) => line.startsWith("| Newsletter |"));
    expect(formsRow).toBeDefined();
    expect(formsRow).toContain("/");
    expect(formsRow).toContain("/about");
    expect(formsRow).toContain("/contact");
  });

  it("counts two genuinely distinct forms on the same route as two forms", () => {
    const input: ReportInput = {
      ...INPUT,
      forms: {
        forms: [
          { route: "/contact", name: "Newsletter", action: null, method: "get", fieldCount: 1, fields: [{ name: "Email", type: "email", required: true }] },
          { route: "/contact", name: "Contact", action: null, method: "post", fieldCount: 3, fields: [{ name: "Name", type: "text", required: true }] },
        ],
      },
    };

    const md = renderReport(input);
    expect(md).toMatch(/\| Forms \| 2 \|/);
    expect(md).toContain("| Newsletter |");
    expect(md).toContain("| Contact |");
  });
});
