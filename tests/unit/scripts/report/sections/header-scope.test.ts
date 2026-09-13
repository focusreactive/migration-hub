import { describe, expect, it } from "vitest";

import { assessComplexity } from "../../../../../src/scripts/report/analysis/complexity.ts";
import { computeMetrics } from "../../../../../src/scripts/report/analysis/metrics.ts";
import { headerSection } from "../../../../../src/scripts/report/sections/header.ts";
import { narrativeSection } from "../../../../../src/scripts/report/sections/narrative.ts";
import { scopeSection } from "../../../../../src/scripts/report/sections/scope.ts";
import { reportInput } from "../fixtures/report-input.ts";

const INPUT = reportInput();
const METRICS = computeMetrics(INPUT);

describe("headerSection", () => {
  it("titles the report as an assessment of the hostname and states the overall rating", () => {
    const md = headerSection(INPUT, METRICS, assessComplexity(METRICS).overall);

    expect(md).toContain("# Migration assessment — example.webflow.io");
    expect(md).toContain("**Source platform:** Webflow");
    expect(md).toContain("**Pages analysed:** 5");
    expect(md).toContain("**Overall complexity: Low**");
  });
});

describe("narrativeSection", () => {
  it("prints the two stored paragraphs and nothing else", () => {
    expect(narrativeSection(INPUT)).toBe(`${INPUT.narrative.site}\n\n${INPUT.narrative.design}`);
  });
});

describe("scopeSection", () => {
  it("reads each count out in the third column", () => {
    const md = scopeSection(INPUT, METRICS);

    expect(md).toContain("| Pages | 5 | 3 hand-composed, 2 CMS entries |");
    expect(md).toContain("| Section types | 4 | 6 instances; 2 used only once |");
    expect(md).toContain("| Images | 2 | plus 1 duplicate already de-duplicated |");
  });
});
