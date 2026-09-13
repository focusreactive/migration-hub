import { describe, expect, it } from "vitest";

import { assessComplexity } from "../../../../../src/scripts/report/analysis/complexity.ts";
import { computeMetrics } from "../../../../../src/scripts/report/analysis/metrics.ts";
import { complexitySection } from "../../../../../src/scripts/report/sections/complexity.ts";
import { contentModelSection } from "../../../../../src/scripts/report/sections/content-model.ts";
import { formsSection } from "../../../../../src/scripts/report/sections/forms.ts";
import { globalsSection } from "../../../../../src/scripts/report/sections/globals.ts";
import { mediaSection } from "../../../../../src/scripts/report/sections/media.ts";
import { pageBuilderPagesSection } from "../../../../../src/scripts/report/sections/page-builder-pages.ts";
import { sectionLibrarySection } from "../../../../../src/scripts/report/sections/section-library.ts";
import { reportInput } from "../fixtures/report-input.ts";

const INPUT = reportInput();
const METRICS = computeMetrics(INPUT);

describe("complexitySection", () => {
  it("prints a two-column table and one paragraph per area, in order", () => {
    const md = complexitySection(assessComplexity(METRICS).areas, INPUT, METRICS);

    expect(md).toContain("| Area | Rating |");
    expect(md).not.toContain("| Why |");
    expect(md.indexOf("**Content model.**")).toBeLessThan(md.indexOf("**Page composition.**"));
    expect(md.indexOf("**Forms & integrations.**")).toBeLessThan(md.indexOf("**Content volume.**"));
  });

  it("states the route shape of collections only when every route pattern really has one dynamic segment", () => {
    const md = complexitySection(assessComplexity(METRICS).areas, INPUT, METRICS);

    expect(md).toContain("one collection, each with a single dynamic segment in its route.");
    expect(md).not.toContain("no cross-referencing");
    expect(md).not.toContain("all flat");

    const nested = reportInput({
      pages: {
        pages: [
          { route: "/", kind: "static" },
          { route: "/docs/guides/a", kind: "item", collectionKey: "k1" },
        ],
        collections: [{ key: "k1", routePattern: "/docs/:category/:slug", itemCount: 1 }],
      },
    });
    const nestedMetrics = computeMetrics(nested);
    const nestedMd = complexitySection(assessComplexity(nestedMetrics).areas, nested, nestedMetrics);

    expect(nestedMd).toContain("one collection. Collections like these map");
    expect(nestedMd).not.toContain("single dynamic segment");
  });

  it("names the real asset hosts, the same ones the asset-hosting risk names", () => {
    const md = complexitySection(assessComplexity(METRICS).areas, INPUT, METRICS);

    expect(md).toContain("the assets are served from cdn.example.com, and those URLs stop working");
    expect(md).not.toContain("Webflow's CDN");
  });

  it("drops the re-hosting claim when no asset resolves to a host", () => {
    const hostless = reportInput({
      media: {
        assets: [
          { assetId: "a".repeat(16), canonicalUrl: "not-a-valid-url", kind: "image", contentType: "image/webp", etag: "e1", sources: ["img-src"], alt: "Team", duplicateOf: null },
        ],
      },
    });
    const hostlessMetrics = computeMetrics(hostless);
    const md = complexitySection(assessComplexity(hostlessMetrics).areas, hostless, hostlessMetrics);

    expect(md).not.toContain("re-hosting");
  });

  it("only claims a project-pacing role for page composition above the lowest rating", () => {
    const md = complexitySection(assessComplexity(METRICS).areas, INPUT, METRICS);

    expect(assessComplexity(METRICS).areas.find((area) => area.id === "pageComposition")?.rating).toBe("Low");
    expect(md).not.toContain("sets the pace of the whole project");

    const wide = reportInput();
    const wideMetrics = { ...computeMetrics(wide), sectionTypes: 30 };
    const wideMd = complexitySection(assessComplexity(wideMetrics).areas, wide, wideMetrics);

    expect(wideMd).toContain("sets the pace of the whole project");
  });

  it("only promises a record-by-record review when content volume is at the lowest rating", () => {
    const md = complexitySection(assessComplexity(METRICS).areas, INPUT, METRICS);

    expect(md).toContain("room to review every record by hand afterwards");

    const heavy = reportInput();
    const heavyMetrics = { ...computeMetrics(heavy), entries: 900 };
    const heavyMd = complexitySection(assessComplexity(heavyMetrics).areas, heavy, heavyMetrics);

    expect(heavyMd).not.toContain("room to review every record by hand afterwards");
    expect(heavyMd).toContain("the import runs in batches with sampled checks");
  });

  it("never repeats a rating inside its own paragraph", () => {
    const md = complexitySection(assessComplexity(METRICS).areas, INPUT, METRICS);
    const paragraphs = md.split("\n\n").filter((block) => block.startsWith("**"));

    for (const paragraph of paragraphs) {
      expect(paragraph).not.toMatch(/\b(Low|Medium|High)\b/);
    }
  });
});

describe("inventory sections", () => {
  it("opens the content model with a lead line and keeps names in the table", () => {
    const md = contentModelSection(INPUT, METRICS);

    expect(md).toContain("single template page that every entry in it reuses");
    expect(md).not.toContain("Journal,");
    expect(md).toContain("| Journal | `/journal/:slug` | 2 |");
  });

  it("says page-builder sections are configured by hand", () => {
    expect(pageBuilderPagesSection(INPUT, METRICS)).toContain("configured by hand as page-builder blocks");
  });

  it("breaks the section library down in its lead line", () => {
    const md = sectionLibrarySection(INPUT, METRICS);

    expect(md).toContain("4 distinct section types used 6 times in total");
    expect(md).toContain("2 appear exactly once");
  });

  it("keeps every clause of the section-library lead line singular at a count of one", () => {
    const md = sectionLibrarySection(INPUT, {
      ...METRICS,
      sectionTypes: 1,
      sectionInstances: 1,
      reusedSectionTypes: 1,
      singleUseSectionTypes: 1,
      dualSourceSectionTypes: 1,
      collectionOnlySectionTypes: 1,
    });

    expect(md).toContain(
      "The pages are built from one distinct section type used once in total: one type appears more than once, "
        + "one appears exactly once, one is used both as page-builder blocks and inside collection templates, "
        + "and one exists only inside a collection template.",
    );
    expect(md).not.toContain("1 distinct section types");
    expect(md).not.toContain("1 times");
  });

  it("dedupes a repeated route and groups collection templates under one pluralised suffix", () => {
    const input = reportInput({
      pages: {
        pages: [...INPUT.pages.pages, { route: "/services/x", kind: "item", collectionKey: "k2" }],
        collections: [...INPUT.pages.collections, { key: "k2", routePattern: "/services/:slug", itemCount: 1 }],
      },
      blocks: {
        types: [
          {
            id: "spacing-scale-specimen",
            name: "Spacing scale specimen",
            role: "spacing-specimen",
            instanceCount: 4,
            members: [
              { route: "/utility-pages/style-guide", order: 1 },
              { route: "/utility-pages/style-guide", order: 2 },
              { route: "/utility-pages/style-guide", order: 3 },
              { route: "/utility-pages/style-guide", order: 4 },
            ],
            exemplar: { route: "/utility-pages/style-guide", order: 1 },
            kinds: ["block"],
          },
          {
            id: "related-items-carousel",
            name: "Related items carousel",
            role: "related-items",
            instanceCount: 2,
            members: [
              { route: "/journal/a", order: 1 },
              { route: "/services/x", order: 1 },
            ],
            exemplar: { route: "/journal/a", order: 1 },
            kinds: ["block", "collectionSection"],
          },
        ],
      },
    });
    const metrics = computeMetrics(input);
    const md = sectionLibrarySection(input, metrics);

    expect(md).toContain("| Spacing scale specimen | 4 | `/utility-pages/style-guide` | Block |");
    expect(md).toContain("Journal, Services (collection templates)");
  });

  it("explains that globals are authored once", () => {
    expect(globalsSection(INPUT, METRICS)).toContain("authored once and reused everywhere");
  });

  it("does not claim total coverage in the lead line when coverage is partial", () => {
    const md = globalsSection(INPUT, METRICS);

    expect(md).toContain("shared rather than placed per page");
    expect(md).not.toContain("They wrap every page-builder page");
    expect(md).toContain("The table below says which pages carry each one.");
  });

  it("claims total coverage in the lead line only when every page really carries every global", () => {
    const input = reportInput({
      globals: {
        types: [
          {
            id: "header",
            name: "Header",
            role: "header",
            instanceCount: 4,
            members: [
              { route: "/", order: 0 },
              { route: "/about", order: 0 },
              { route: "/utility-pages/style-guide", order: 0 },
              { route: "/journal/a", order: 0 },
            ],
            exemplar: { route: "/", order: 0 },
          },
        ],
      },
    });
    const md = globalsSection(input, computeMetrics(input));

    expect(md).toContain(
      "one section is shared rather than placed per page. They wrap every page-builder page and the collection "
        + "template, so each is authored once and reused everywhere.",
    );
  });

  it("prints the three-column globals header and states genuine coverage, not a tautological max", () => {
    const md = globalsSection(INPUT, METRICS);

    expect(md).toContain("| Global | Instances | Appears on |");
    expect(md).toContain("| Header | 3 | 3 of 4 pages |");
    expect(md).not.toContain("| Header | 3 | every page-builder page");

    const fullyCoveredInput = reportInput({
      globals: {
        types: [
          {
            id: "header",
            name: "Header",
            role: "header",
            instanceCount: 4,
            members: [
              { route: "/", order: 0 },
              { route: "/about", order: 0 },
              { route: "/utility-pages/style-guide", order: 0 },
              { route: "/journal/a", order: 0 },
            ],
            exemplar: { route: "/", order: 0 },
          },
        ],
      },
    });
    const fullyCoveredMetrics = computeMetrics(fullyCoveredInput);
    const fullMd = globalsSection(fullyCoveredInput, fullyCoveredMetrics);

    expect(fullMd).toContain("| Header | 4 | every page-builder page and the collection template |");

    const singleGlobalPartialInput = reportInput({
      pages: {
        pages: [
          { route: "/", kind: "static" },
          { route: "/about", kind: "static" },
          { route: "/contact", kind: "static" },
          { route: "/utility-pages/style-guide", kind: "static" },
        ],
        collections: [],
      },
      globals: {
        types: [
          {
            id: "nav",
            name: "Nav",
            role: "nav",
            instanceCount: 3,
            members: [
              { route: "/", order: 0 },
              { route: "/about", order: 0 },
              { route: "/contact", order: 0 },
            ],
            exemplar: { route: "/", order: 0 },
          },
        ],
      },
    });
    const singleGlobalPartialMetrics = computeMetrics(singleGlobalPartialInput);
    const partialMd = globalsSection(singleGlobalPartialInput, singleGlobalPartialMetrics);

    expect(partialMd).toContain("| Nav | 3 | 3 of 4 pages |");
    expect(partialMd).not.toContain("| Nav | 3 | every page-builder page");
  });

  it("lists forms with their fields and no endpoint column", () => {
    const md = formsSection(INPUT, METRICS);

    expect(md).toContain("| Form | Fields |");
    expect(md).not.toContain("Endpoint");
    expect(md).not.toContain("handled by the platform");
  });

  it("prints the media table and the font table", () => {
    const md = mediaSection(INPUT, METRICS);

    expect(md).toContain("| Unique images | 2 |");
    expect(md).toContain("| Images without alt text | 1 |");
    expect(md).toContain("| Inter | 400 | normal | Google Fonts |");
  });
});
