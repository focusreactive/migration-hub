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
      {
        id: "hero",
        name: "Hero",
        role: "hero",
        instanceCount: 2,
        members: [{ route: "/", order: 1 }, { route: "/about", order: 1 }],
        exemplar: { route: "/", order: 1 },
        kinds: ["block"],
      },
      {
        id: "cta",
        name: "CTA panel",
        role: "cta",
        instanceCount: 2,
        members: [{ route: "/about", order: 5 }, { route: "/journal/a", order: 5 }],
        exemplar: { route: "/about", order: 5 },
        kinds: ["block", "collectionSection"],
      },
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

  it("labels a block used only on page-builder pages as Block", () => {
    const row = renderReport(INPUT)
      .split("\n")
      .find((line) => line.startsWith("| Hero |"));
    expect(row).toBe("| Hero | 2 | /, /about | Block |");
  });

  it("labels a block merged from a page-builder page and a collection exemplar as both", () => {
    const row = renderReport(INPUT)
      .split("\n")
      .find((line) => line.startsWith("| CTA panel |"));
    expect(row).toBe("| CTA panel | 2 | /about, Journal (collection template) | Block, Collection section |");
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
    expect(formsRow).toBe("| Newsletter | 1 | handled by the platform | /, /about, /contact |");
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

describe("renderReport anonymous form labels", () => {
  it("labels an unnamed form from all its named fields, including optional ones", () => {
    const input: ReportInput = {
      ...INPUT,
      forms: {
        forms: [
          {
            route: "/contact",
            name: null,
            action: null,
            method: "get",
            fieldCount: 3,
            fields: [
              { name: "Name", type: "text", required: true },
              { name: "Email", type: "email", required: true },
              { name: "website", type: "text", required: false },
            ],
          },
        ],
      },
    };

    expect(renderReport(input)).toContain("| Name, Email, website | 3 |");
  });

  it("falls back to all named fields when none are required", () => {
    const input: ReportInput = {
      ...INPUT,
      forms: {
        forms: [
          {
            route: "/contact",
            name: null,
            action: null,
            method: "get",
            fieldCount: 2,
            fields: [
              { name: "A", type: "text", required: false },
              { name: "B", type: "text", required: false },
            ],
          },
        ],
      },
    };

    expect(renderReport(input)).toContain("| A, B | 2 |");
  });

  it("filters out unnamed fields instead of rendering empty commas", () => {
    const input: ReportInput = {
      ...INPUT,
      forms: {
        forms: [
          {
            route: "/contact",
            name: null,
            action: null,
            method: "get",
            fieldCount: 2,
            fields: [
              { name: "", type: "text", required: true },
              { name: "Name", type: "text", required: true },
            ],
          },
        ],
      },
    };

    const md = renderReport(input);
    expect(md).toContain("| Name | 2 |");
    expect(md).not.toContain(", ,");
  });

  it("falls back to an em dash when no field carries a name", () => {
    const input: ReportInput = {
      ...INPUT,
      forms: {
        forms: [
          {
            route: "/contact",
            name: null,
            action: null,
            method: "get",
            fieldCount: 1,
            fields: [{ name: "", type: "text", required: false }],
          },
        ],
      },
    };

    expect(renderReport(input)).toContain("| — | 1 |");
  });

  it("caps a long field list with an ellipsis", () => {
    const input: ReportInput = {
      ...INPUT,
      forms: {
        forms: [
          {
            route: "/contact",
            name: null,
            action: null,
            method: "get",
            fieldCount: 7,
            fields: Array.from({ length: 7 }, (_, index) => ({
              name: `F${index + 1}`,
              type: "text",
              required: true,
            })),
          },
        ],
      },
    };

    expect(renderReport(input)).toContain("| F1, F2, F3, F4, F5, … | 7 |");
  });
});

describe("renderReport form ordering", () => {
  it("sorts distinct forms by field count numerically, not lexicographically", () => {
    const tenFields = Array.from({ length: 10 }, (_, index) => ({
      name: `C${index + 1}`,
      type: "text",
      required: true,
    }));

    const input: ReportInput = {
      ...INPUT,
      forms: {
        forms: [
          { route: "/x", name: null, action: null, method: "get", fieldCount: 10, fields: tenFields },
          {
            route: "/x",
            name: null,
            action: null,
            method: "get",
            fieldCount: 2,
            fields: [
              { name: "A", type: "text", required: true },
              { name: "B", type: "text", required: true },
            ],
          },
        ],
      },
    };

    const md = renderReport(input);
    const twoFieldIndex = md.indexOf("| A, B | 2 |");
    const tenFieldIndex = md.indexOf("| C1, C2, C3, C4, C5, … | 10 |");
    expect(twoFieldIndex).toBeGreaterThan(-1);
    expect(tenFieldIndex).toBeGreaterThan(-1);
    expect(twoFieldIndex).toBeLessThan(tenFieldIndex);
  });
});

describe("renderReport table cell escaping", () => {
  it("escapes a pipe character in a form name", () => {
    const input: ReportInput = {
      ...INPUT,
      forms: {
        forms: [{ route: "/contact", name: "A | B", action: null, method: "post", fieldCount: 0, fields: [] }],
      },
    };

    expect(renderReport(input)).toContain("| A \\| B | 0 |");
  });
});
