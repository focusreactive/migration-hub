import { describe, expect, it } from "vitest";

import { assessComplexity } from "../../../../../src/scripts/report/analysis/complexity.ts";
import { computeMetrics } from "../../../../../src/scripts/report/analysis/metrics.ts";
import { COMPLEXITY_PARAGRAPHS } from "../../../../../src/scripts/report/constants/complexity-copy.ts";
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

    expect(md).toContain("One collection, with a single dynamic segment in its route.");
    expect(md).not.toContain("each with a single dynamic segment");
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

    expect(nestedMd).toContain("One collection. Collections like these map");
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

  // Asserted on the copy rather than the rendered section: both reports clamp a
  // complexity paragraph to three sentences, and the pacing claim is the fourth.
  it("only claims a project-pacing role for page composition above the lowest rating", () => {
    expect(assessComplexity(METRICS).areas.find((area) => area.id === "pageComposition")?.rating).toBe("Low");
    expect(COMPLEXITY_PARAGRAPHS.pageComposition(METRICS, INPUT, "Low")).not.toContain(
      "sets the pace of the whole project",
    );

    const wide = reportInput();
    const wideMetrics = { ...computeMetrics(wide), sectionTypes: 30 };

    expect(COMPLEXITY_PARAGRAPHS.pageComposition(wideMetrics, wide, "Medium")).toContain(
      "sets the pace of the whole project",
    );
  });

  it("only promises a record-by-record review when content volume is at the lowest rating", () => {
    const md = complexitySection(assessComplexity(METRICS).areas, INPUT, METRICS);

    expect(md).toContain("room to review every record by hand afterwards");

    const heavy = reportInput();
    const heavyMetrics = { ...computeMetrics(heavy), collectionDocuments: 900 };
    const heavyMd = complexitySection(assessComplexity(heavyMetrics).areas, heavy, heavyMetrics);

    expect(heavyMd).not.toContain("room to review every record by hand afterwards");
    expect(heavyMd).toContain("the import runs in batches with sampled checks");
  });

  it("drops the dual-source clause from the page-composition paragraph when no type serves both sources", () => {
    const metrics = { ...METRICS, sectionTypes: 30, dualSourceSectionTypes: 0 };
    const md = complexitySection(assessComplexity(metrics).areas, INPUT, metrics);

    expect(md).not.toContain("0 types appear both");
    expect(md).not.toContain("free-standing page-builder blocks");
  });

  it("keeps the page-composition clauses singular at a count of one", () => {
    const metrics = { ...METRICS, sectionTypes: 30, sectionInstances: 40, singleUseSectionTypes: 1, dualSourceSectionTypes: 1 };
    const md = complexitySection(assessComplexity(metrics).areas, INPUT, metrics);

    expect(md).toContain("one of those types appears exactly once");
    expect(md).toContain("One type appears both as free-standing page-builder blocks");
    expect(md).toContain("none of the leverage. One type appears both as free-standing page-builder blocks");
    expect(md).not.toContain(". one type appears");
    expect(md).toContain("that component has to accept content from two different sources");
    expect(md).not.toContain("1 types");
  });

  it("drops the long-tail claim from the page-composition paragraph when no type is used only once", () => {
    const metrics = { ...METRICS, sectionTypes: 30, singleUseSectionTypes: 0 };
    const md = complexitySection(assessComplexity(metrics).areas, INPUT, metrics);

    expect(md).toContain("and every one of those types is reused");
    expect(md).not.toContain("0 of those types");
    expect(md).not.toContain("a long tail costs nearly as much");
  });

  it("drops the forms counters when the site has no form and keeps them singular at one", () => {
    const none = { ...METRICS, forms: 0, platformHandledForms: 0 };
    const noneMd = complexitySection(assessComplexity(none).areas, INPUT, none);

    expect(noneMd).toContain("No form collects input anywhere on this site");
    expect(noneMd).not.toContain("0 forms");

    const one = { ...METRICS, forms: 1, platformHandledForms: 1 };
    const oneMd = complexitySection(assessComplexity(one).areas, INPUT, one);

    expect(oneMd).toContain("One form collects input, and it does not post to an endpoint of its own");
    expect(oneMd).not.toContain("none of them post");
  });

  it("says a form posts to its own endpoint rather than counting zero platform-handled forms", () => {
    const metrics = { ...METRICS, forms: 2, platformHandledForms: 0 };
    const md = complexitySection(assessComplexity(metrics).areas, INPUT, metrics);

    expect(md).toContain("2 forms collect input, and every one of them posts to an endpoint of its own");
    expect(md).toContain("Those endpoints carry over unchanged");
    expect(md).toContain("keep posting to them");
    expect(md).not.toContain("0 of them");

    const oneMetrics = { ...METRICS, forms: 1, platformHandledForms: 0 };
    const oneMd = complexitySection(assessComplexity(oneMetrics).areas, INPUT, oneMetrics);

    expect(oneMd).toContain(
      "One form collects input, and it posts to an endpoint of its own rather than to Webflow's built-in "
        + "handler. That endpoint carries over unchanged, so the new site has to reproduce the fields and keep "
        + "posting to it.",
    );
    expect(oneMd).not.toContain("every one of them");
    expect(oneMd).not.toContain("Those endpoints");
    expect(oneMd).not.toContain("posting to them");
  });

  it("replaces the content-volume and content-model counters when the counters are zero", () => {
    const noDocuments = { ...METRICS, collectionDocuments: 0 };
    const noDocumentsMd = complexitySection(assessComplexity(noDocuments).areas, INPUT, noDocuments);

    expect(noDocumentsMd).toContain("with no published documents yet");
    expect(noDocumentsMd).not.toContain("0 published documents");

    const noCollections = { ...METRICS, collections: 0, collectionDocuments: 0 };
    const noCollectionsMd = complexitySection(assessComplexity(noCollections).areas, INPUT, noCollections);

    expect(noCollectionsMd).toContain("no document types to carry over");
    expect(noCollectionsMd).toContain("no collection documents to import");
    expect(noCollectionsMd).not.toContain("0 collections");
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

    expect(md).toContain("single collection template page that every document in it reuses");
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
      "The 4 unique layout pages are built from one distinct section type used once in total: "
        + "one type appears more than once, "
        + "one appears exactly once, one is used both as a page-builder block and inside a collection template page, "
        + "and one exists only inside a collection template page.",
    );
    expect(md).not.toContain("1 distinct section types");
    expect(md).not.toContain("1 times");
  });

  it("drops the section-library clauses whose counter is zero", () => {
    const md = sectionLibrarySection(INPUT, {
      ...METRICS,
      reusedSectionTypes: 2,
      singleUseSectionTypes: 3,
      dualSourceSectionTypes: 0,
      collectionOnlySectionTypes: 0,
    });

    expect(md).toContain("2 types appear more than once and 3 appear exactly once.");
    expect(md).not.toContain("0 are used both");
    expect(md).not.toContain("0 exist only");
  });

  it("moves the noun onto the first surviving section-library clause", () => {
    const md = sectionLibrarySection(INPUT, {
      ...METRICS,
      reusedSectionTypes: 0,
      singleUseSectionTypes: 4,
      dualSourceSectionTypes: 0,
      collectionOnlySectionTypes: 0,
    });

    expect(md).toContain("in total: 4 types appear exactly once.");
    expect(md).not.toContain("0 types appear more than once");
  });

  it("says every page comes from a collection instead of counting zero page-builder pages", () => {
    const md = pageBuilderPagesSection(INPUT, { ...METRICS, pageBuilderPages: 0 });

    expect(md).toContain("Every page on this site is generated from a collection");
    expect(md).not.toContain("0 pages stand");
    expect(md).not.toContain("| Page | Slug |");
  });

  it("keeps the page-builder lead singular at one page", () => {
    const md = pageBuilderPagesSection(INPUT, { ...METRICS, pageBuilderPages: 1 });

    expect(md).toContain("One page-builder page stands on its own");
    expect(md).toContain("It is assembled section by section");
    expect(md).not.toContain("stands on their own");
  });

  it("keeps the content-model lead singular at one collection", () => {
    const md = contentModelSection(INPUT, { ...METRICS, collections: 1 });

    expect(md).toContain("One collection makes up the CMS side of this site. It is rendered through");
    expect(md).not.toContain("Each is rendered");
  });

  it("dedupes a repeated route and groups collection template pages under one pluralised suffix", () => {
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
    expect(md).toContain("Journal template page, Services template page");
  });

  it("explains that globals are authored once", () => {
    expect(globalsSection(INPUT, METRICS)).toContain("authored once and reused everywhere");
  });

  it("does not claim total coverage in the lead line when coverage is partial", () => {
    const md = globalsSection(INPUT, METRICS);

    expect(md).toContain("shared rather than placed per page");
    expect(md).not.toContain("They wrap every page-builder page");
    expect(md).toContain("reused everywhere instead of being rebuilt page by page.");
    expect(md).not.toContain("The table below");
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
      "One section is shared rather than placed per page. It wraps every page-builder page and the collection "
        + "template page, so it is authored once and reused everywhere.",
    );
  });

  it("prints the three-column globals header and states genuine coverage, not a tautological max", () => {
    const md = globalsSection(INPUT, METRICS);

    expect(md).toContain("| Global | Instances | Appears on |");
    expect(md).toContain("| Header | 3 | 2 page-builder pages · one collection template page |");
    expect(md).not.toContain("| Header | 3 | 3 page-builder pages");

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

    expect(fullMd).toContain("| Header | 4 | 3 page-builder pages · one collection template page |");

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

    expect(partialMd).toContain("| Nav | 3 | 3 page-builder pages · 0 collection template pages |");
    expect(partialMd).not.toContain("| Nav | 3 | 4 page-builder pages");
  });

  it("lists forms with their fields and no endpoint column", () => {
    const md = formsSection(INPUT, METRICS);

    expect(md).toContain("| Form | Fields |");
    expect(md).not.toContain("Endpoint");
    expect(md).not.toContain("handled by the platform");
  });

  it("keeps the forms lead singular at one form and plural above it", () => {
    const md = formsSection(INPUT, { ...METRICS, forms: 1 });

    expect(md).toContain("One distinct form collects input on this site, listed below with the fields it submits.");
    expect(md).not.toContain("each one submits");

    const manyMd = formsSection(INPUT, { ...METRICS, forms: 2 });

    expect(manyMd).toContain(
      "2 distinct forms collect input on this site, listed below with the fields each one submits.",
    );
  });

  it("prints the media table and the font table", () => {
    const md = mediaSection(INPUT, METRICS);

    expect(md).toContain("| Unique images | 2 |");
    expect(md).toContain("| Images without alt text | 1 |");
    expect(md).toContain("| Inter | 400 | normal | Google Fonts |");
  });
});
