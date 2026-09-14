import { describe, expect, it } from "vitest";

import { computeMetrics } from "../../../../../src/scripts/report/analysis/metrics.ts";
import { assessComplexity } from "../../../../../src/scripts/report/analysis/complexity.ts";
import { reportInput } from "../fixtures/report-input.ts";

const NOVA_LIKE = {
  routes: 22,
  pageBuilderPages: 9,
  collections: 3,
  collectionDocuments: 13,
  uniqueLayoutPages: 12,
  sectionTypes: 34,
  sectionInstances: 54,
  reusedSectionTypes: 11,
  singleUseSectionTypes: 23,
  dualSourceSectionTypes: 4,
  collectionOnlySectionTypes: 6,
  utilitySectionTypes: 13,
  globals: 2,
  forms: 2,
  platformHandledForms: 2,
  images: 51,
  videos: 0,
  duplicateAssets: 2,
  imagesWithoutAlt: 44,
  assetHosts: ["cdn.prod.website-files.com"],
  fonts: 1,
  licensedFonts: 0,
};

describe("assessComplexity", () => {
  it("returns the five areas in the fixed order", () => {
    const { areas } = assessComplexity(NOVA_LIKE);

    expect(areas.map((area) => area.id)).toEqual([
      "contentModel",
      "pageComposition",
      "designSystem",
      "forms",
      "contentVolume",
    ]);
  });

  it("rates a nova-x shaped site Medium overall, driven by page composition and forms", () => {
    const { areas, overall } = assessComplexity(NOVA_LIKE);
    const rating = (id: string) => areas.find((area) => area.id === id)?.rating;

    expect(rating("contentModel")).toBe("Low");
    expect(rating("pageComposition")).toBe("Medium");
    expect(rating("designSystem")).toBe("Low");
    expect(rating("forms")).toBe("Medium");
    expect(rating("contentVolume")).toBe("Low");
    expect(overall).toBe("Medium");
  });

  it("rates a site with no forms Low on forms", () => {
    const { areas } = assessComplexity({ ...NOVA_LIKE, forms: 0, platformHandledForms: 0 });
    expect(areas.find((area) => area.id === "forms")?.rating).toBe("Low");
  });

  it("raises design system to Medium when a licensed font is in play", () => {
    const { areas } = assessComplexity({ ...NOVA_LIKE, fonts: 2, licensedFonts: 1 });
    expect(areas.find((area) => area.id === "designSystem")?.rating).toBe("Medium");
  });

  it("goes High overall as soon as one area is High", () => {
    const { overall } = assessComplexity({ ...NOVA_LIKE, sectionTypes: 90 });
    expect(overall).toBe("High");
  });

  it("rates the small test fixture Low everywhere", () => {
    const { overall } = assessComplexity(computeMetrics(reportInput()));
    expect(overall).toBe("Low");
  });
});
