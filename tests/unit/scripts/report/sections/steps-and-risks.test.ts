import { describe, expect, it } from "vitest";

import { assessRisks } from "../../../../../src/scripts/report/analysis/risks.ts";
import { computeMetrics } from "../../../../../src/scripts/report/analysis/metrics.ts";
import { migrationStepsSection } from "../../../../../src/scripts/report/sections/migration-steps.ts";
import { risksSection } from "../../../../../src/scripts/report/sections/risks.ts";
import { toolsSection } from "../../../../../src/scripts/report/sections/tools.ts";
import { reportInput } from "../fixtures/report-input.ts";

const INPUT = reportInput();
const METRICS = computeMetrics(INPUT);

describe("risksSection", () => {
  it("numbers the risks and indents their bodies", () => {
    const md = risksSection(assessRisks(INPUT, METRICS));

    expect(md).toContain("## Risks & watch-outs");
    expect(md).toMatch(/^1\. \*\*/m);
    expect(md).toMatch(/^ {3}\S/m);
  });
});

describe("migrationStepsSection", () => {
  it("renders five steps in the present tense with no first person", () => {
    const md = migrationStepsSection(METRICS);

    expect(md).toContain("## How the migration runs");
    expect(md).toContain(
      "**Page discovery.** All 5 published pages are split into 3 page-builder pages and one collection "
        + "template page — 4 unique layout pages in all.",
    );
    expect(md).toContain("**Section generation.** A component is generated for each of the 4 section types, the one shared global and the one form.");
    expect(md).not.toMatch(/\bwe\b/i);
    expect(md.split("\n").filter((line) => /^\d\. /.test(line))).toHaveLength(5);
  });

  it("drops a clause whose counter is zero", () => {
    const md = migrationStepsSection({ ...METRICS, forms: 0, globals: 0, videos: 0 });

    expect(md).toContain("A component is generated for each of the 4 section types.");
    expect(md).not.toContain("0 forms");
  });

  it("uses the short variants on a site with no collections", () => {
    const md = migrationStepsSection({ ...METRICS, collections: 0, collectionDocuments: 0 });

    expect(md).toContain("All 5 published pages are page-builder pages.");
    expect(md).toContain("The content model is derived from the page structures first");
    expect(md).not.toContain("0 collection template pages");
  });

  it("keeps the page sentences singular on a single-route site", () => {
    const md = migrationStepsSection({ ...METRICS, pages: 1, pageBuilderPages: 1, collections: 0, collectionDocuments: 0 });

    expect(md).toContain("**Page discovery.** The one published page is a page-builder page.");
    expect(md).toContain(
      "The content model is derived from the page structures first, then the content of the one page is "
        + "extracted against it.",
    );
    expect(md).not.toContain("All 1 published routes");
    expect(md).not.toContain("all 1 routes");
  });

  it("keeps the page sentences singular when the single route comes from a collection", () => {
    const md = migrationStepsSection({ ...METRICS, pages: 1, pageBuilderPages: 0, collections: 1, collectionDocuments: 1 });

    expect(md).toContain("**Page discovery.** The one published page is split into one collection template page.");
    expect(md).toContain("the one collection document and the content of the one page are extracted against it.");
    expect(md).not.toContain("All 1 published routes");
  });

  it("mentions videos only when the site has them", () => {
    expect(migrationStepsSection({ ...METRICS, videos: 3 })).toContain("and 3 videos");
    expect(migrationStepsSection(METRICS)).not.toContain("videos");
  });

  it("drops the page-builder-pages clause when a collections-only site has no static pages", () => {
    const md = migrationStepsSection({ ...METRICS, pageBuilderPages: 0 });

    expect(md).toContain("All 5 published pages are split into one collection template page.");
    expect(md).not.toContain("0 page-builder");
    expect(md).not.toMatch(/ ,/);
    expect(md).not.toMatch(/ {2}/);
    expect(md).not.toMatch(/\band\./);
  });

  it("drops the collection-documents clause when a collection has no published documents yet", () => {
    const md = migrationStepsSection({ ...METRICS, collectionDocuments: 0 });

    expect(md).toContain(
      "The content model is derived from the one collection template page and the page structures first, "
        + "then the content of all 5 pages is extracted against it.",
    );
    expect(md).not.toContain("0 collection documents");
    expect(md).not.toMatch(/ ,/);
    expect(md).not.toMatch(/ {2}/);
    expect(md).not.toMatch(/\band\./);
  });

  it("drops the fonts clause when the site has no distinct font families", () => {
    const md = migrationStepsSection({ ...METRICS, fonts: 0 });

    expect(md).toContain(
      "**Asset extraction.** The 2 unique images are pulled off the source CDN with their metadata.",
    );
    expect(md).not.toContain("font");
    expect(md).not.toMatch(/ ,/);
    expect(md).not.toMatch(/ {2}/);
  });

  it("pins singular grammar for one image alongside one video", () => {
    const md = migrationStepsSection({ ...METRICS, images: 1, videos: 1 });

    expect(md).toContain(
      "The one unique image and one video are pulled off the source CDN with their metadata, "
        + "along with the one font family the site is set in.",
    );
  });

  it("pins singular grammar and the singular pronoun for one image with no video", () => {
    const md = migrationStepsSection({ ...METRICS, images: 1, videos: 0 });

    expect(md).toContain(
      "The one unique image is pulled off the source CDN with its metadata, "
        + "along with the one font family the site is set in.",
    );
    expect(md).not.toContain("their metadata");
  });

  it("drops the images clause entirely when the site has zero images, keeping the video clause", () => {
    const md = migrationStepsSection({ ...METRICS, images: 0, videos: 1 });

    expect(md).toContain(
      "The one video is pulled off the source CDN with its metadata, along with the one font family the site is set in.",
    );
    expect(md).not.toContain("0 unique image");
    expect(md).not.toMatch(/ ,/);
    expect(md).not.toMatch(/ {2}/);
  });

  it("does not invent a media clause when the site has no images and no videos at all", () => {
    const md = migrationStepsSection({ ...METRICS, images: 0, videos: 0 });

    expect(md).toContain(
      "No images or videos are hosted on the source CDN. The one font family the site is set in is pulled off it with its metadata.",
    );
    expect(md).not.toContain("0 unique image");
    expect(md).not.toContain("0 videos");
    expect(md).not.toMatch(/ ,/);
    expect(md).not.toMatch(/ {2}/);
  });
});

describe("toolsSection", () => {
  it("links only the tools of the detected platform", () => {
    const md = toolsSection(INPUT);

    expect(md).toContain("webflow-to-sanity-migration");
    expect(md).not.toContain("framer-to-sanity-migration");
  });
});
