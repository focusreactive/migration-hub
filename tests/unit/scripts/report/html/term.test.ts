import { describe, expect, it } from "vitest";

import { GLOSSARY_TERMS } from "../../../../../src/scripts/report/html/constants/terms.ts";
import { term } from "../../../../../src/scripts/report/html/utils/term.ts";

describe("term", () => {
  it("renders the design's tooltip span", () => {
    expect(term("uniqueLayoutPage", "unique layout pages")).toBe(
      `<span class="term" tabindex="0" data-def="${GLOSSARY_TERMS.uniqueLayoutPage}">unique layout pages</span>`,
    );
  });

  it("falls back to the term's own name", () => {
    expect(term("collection")).toContain(">Collections<");
  });

  it("escapes a label that contains markup characters", () => {
    expect(term("global", "header & footer")).toContain(">header &amp; footer<");
  });
});

describe("GLOSSARY_TERMS", () => {
  it("defines every term the report uses", () => {
    expect(Object.keys(GLOSSARY_TERMS).sort()).toEqual(
      [
        "collection",
        "collectionDocument",
        "collectionTemplatePage",
        "global",
        "page",
        "pageBuilderPage",
        "section",
        "sectionInstance",
        "sectionType",
        "uniqueLayoutPage",
      ].sort(),
    );
  });

  it("keeps every definition short enough for the tooltip", () => {
    for (const definition of Object.values(GLOSSARY_TERMS)) expect(definition.length).toBeLessThanOrEqual(220);
  });
});
