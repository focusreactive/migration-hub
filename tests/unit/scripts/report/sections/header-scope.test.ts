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
    expect(md).toContain("**Pages analysed:** 5 · **Unique layout pages:** 4");
    expect(md).toContain("**Overall complexity: Low**");
  });
});

describe("narrativeSection", () => {
  it("prints the two stored paragraphs and nothing else", () => {
    expect(narrativeSection(INPUT)).toBe(`${INPUT.narrative.site}\n\n${INPUT.narrative.design}`);
  });
});

function scopeFor(overrides: Parameters<typeof reportInput>[0]): string {
  const input = reportInput(overrides);
  return scopeSection(input, computeMetrics(input));
}

describe("scopeSection", () => {
  it("reads each count out in the third column", () => {
    const md = scopeSection(INPUT, METRICS);

    expect(md).toContain("| Pages | 5 | 3 page-builder pages and 2 collection documents |");
    expect(md).toContain("| Section types | 4 | 6 instances; 2 used only once |");
    expect(md).toContain("| Pages | 5 | 3 page-builder pages and 2 collection documents |");
    expect(md).toContain("| Images | 2 | plus 1 duplicate already de-duplicated |");
  });

  it("agrees the section-types reading with its counts and drops clauses whose counter is zero", () => {
    const md = scopeSection(INPUT, { ...METRICS, sectionTypes: 1, sectionInstances: 1, singleUseSectionTypes: 1 });

    expect(md).toContain("| Section types | 1 | 1 instance; 1 used only once |");
    expect(md).not.toContain("1 instances");

    const reused = scopeSection(INPUT, { ...METRICS, singleUseSectionTypes: 0 });
    expect(reused).toContain("| Section types | 4 | 6 instances |");
    expect(reused).not.toContain("0 used only once");

    const empty = scopeSection(INPUT, { ...METRICS, sectionTypes: 0, sectionInstances: 0, singleUseSectionTypes: 0 });
    expect(empty).toContain("| Section types | 0 | — |");
  });

  it("agrees the pages reading with the document count", () => {
    expect(scopeSection(INPUT, { ...METRICS, collectionDocuments: 1 })).toContain(
      "| Pages | 5 | 3 page-builder pages and one collection document |",
    );
  });

  it("spells out what a unique layout page is", () => {
    expect(scopeSection(INPUT, METRICS)).toContain(
      "| Unique layout pages | 4 | 3 page-builder pages plus one document per collection template page — every distinct layout, once |",
    );
  });

  it("derives the shared-globals reading from the globals' own names and coverage", () => {
    expect(scopeSection(INPUT, METRICS)).toContain(
      "| Shared globals | 1 | Header, on 2 of 3 page-builder pages and the collection template page |",
    );
  });

  it("names every global and says every page only when every page really carries them", () => {
    const members = [
      { route: "/", order: 0 },
      { route: "/about", order: 0 },
      { route: "/utility-pages/style-guide", order: 0 },
      { route: "/journal/a", order: 0 },
    ];
    const md = scopeFor({
      globals: {
        types: [
          { id: "nav", name: "Nav", role: "nav", instanceCount: 4, members, exemplar: { route: "/", order: 0 } },
          { id: "bar", name: "Announcement bar", role: "banner", instanceCount: 4, members, exemplar: { route: "/", order: 0 } },
          { id: "footer", name: "Footer", role: "footer", instanceCount: 4, members, exemplar: { route: "/", order: 0 } },
        ],
      },
    });

    expect(md).toContain("| Shared globals | 3 | Nav, Announcement bar and Footer, on every page |");
    expect(md).not.toContain("Header and footer");
  });

  it("spans the reading when globals differ in coverage, and dashes it when there are none", () => {
    const spanned = scopeFor({
      globals: {
        types: [
          { id: "nav", name: "Nav", role: "nav", instanceCount: 2, members: [{ route: "/", order: 0 }, { route: "/about", order: 0 }], exemplar: { route: "/", order: 0 } },
          { id: "footer", name: "Footer", role: "footer", instanceCount: 1, members: [{ route: "/", order: 0 }], exemplar: { route: "/", order: 0 } },
        ],
      },
    });

    expect(spanned).toContain(
      "| Shared globals | 2 | Nav and Footer, on 1–2 of 3 page-builder pages and no collection template page |",
    );
    expect(scopeFor({ globals: { types: [] } })).toContain("| Shared globals | 0 | — |");
  });

  it("labels a font source with the shared label and counts its weights in digits", () => {
    expect(scopeSection(INPUT, METRICS)).toContain("| Font families | 1 | Inter (Google Fonts), 1 weight |");

    const selfHosted = scopeFor({
      fonts: {
        families: [
          { family: "Söhne", weights: ["400", "700"], styles: ["normal"], classification: "custom", sources: ["font-face"] },
        ],
      },
    });

    expect(selfHosted).toContain("| Font families | 1 | Söhne (Self-hosted), 2 weights |");
    expect(selfHosted).not.toContain("(Custom)");
    expect(scopeFor({ fonts: { families: [] } })).toContain("| Font families | 0 | — |");
  });

  it("quantifies platform-handled forms by how many there are", () => {
    const form = (route: string, name: string) => ({
      route,
      name,
      action: null,
      method: "post" as const,
      fieldCount: 1,
      fields: [{ name: `${name}-email`, type: "email", required: true }],
    });

    expect(scopeSection(INPUT, METRICS)).toContain("| Forms | 1 | it is submitted to Webflow's endpoint |");
    expect(scopeFor({ forms: { forms: [form("/a", "A"), form("/b", "B")] } })).toContain(
      "| Forms | 2 | both submitted to Webflow's endpoint |",
    );
    expect(scopeFor({ forms: { forms: [form("/a", "A"), form("/b", "B"), form("/c", "C")] } })).toContain(
      "| Forms | 3 | all submitted to Webflow's endpoint |",
    );
  });

  it("dashes the forms reading when no form is platform-handled and when there are none", () => {
    const external = scopeFor({
      forms: {
        forms: [
          { route: "/contact", name: "Contact", action: "https://hooks.example.com/x", method: "post", fieldCount: 1, fields: [{ name: "Email", type: "email", required: true }] },
        ],
      },
    });

    expect(external).toContain("| Forms | 1 | — |");
    expect(scopeFor({ forms: { forms: [] } })).toContain("| Forms | 0 | — |");
  });
});
