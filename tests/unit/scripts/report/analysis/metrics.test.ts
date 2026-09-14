import { describe, expect, it } from "vitest";

import { computeMetrics } from "../../../../../src/scripts/report/analysis/metrics.ts";
import { reportInput } from "../fixtures/report-input.ts";

describe("computeMetrics", () => {
  it("counts pages, page-builder pages, collections, documents and unique layout pages", () => {
    const metrics = computeMetrics(reportInput());

    expect(metrics.pages).toBe(5);
    expect(metrics.pageBuilderPages).toBe(3);
    expect(metrics.collections).toBe(1);
    expect(metrics.collectionDocuments).toBe(2);
    expect(metrics.uniqueLayoutPages).toBe(4);
  });

  it("splits section types by reuse, source and utility scaffolding", () => {
    const metrics = computeMetrics(reportInput());

    expect(metrics.sectionTypes).toBe(4);
    expect(metrics.sectionInstances).toBe(6);
    expect(metrics.reusedSectionTypes).toBe(2);
    expect(metrics.singleUseSectionTypes).toBe(2);
    expect(metrics.dualSourceSectionTypes).toBe(1);
    expect(metrics.collectionOnlySectionTypes).toBe(1);
    expect(metrics.utilitySectionTypes).toBe(1);
  });

  it("excludes duplicates from the image count and reports the hosts", () => {
    const metrics = computeMetrics(reportInput());

    expect(metrics.images).toBe(2);
    expect(metrics.duplicateAssets).toBe(1);
    expect(metrics.videos).toBe(0);
    expect(metrics.imagesWithoutAlt).toBe(1);
    expect(metrics.assetHosts).toEqual(["cdn.example.com"]);
  });

  it("counts distinct forms and how many the platform handles", () => {
    const metrics = computeMetrics(reportInput());

    expect(metrics.forms).toBe(1);
    expect(metrics.platformHandledForms).toBe(1);
  });
});
