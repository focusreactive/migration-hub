import { describe, expect, it } from "vitest";

import { sectionsResponseSchema } from "../../../../src/scripts/discovery/schemas/sections-response.ts";

const BLOCK = { order: 0, role: "hero", summary: "title and subtitle", anchor: { selector: "section.hero", matchCount: 1 } };
const OK = { route: "/about", globals: [], blocks: [BLOCK] };

describe("sectionsResponseSchema", () => {
  it("accepts a well-formed response", () => {
    expect(sectionsResponseSchema.safeParse(OK).success).toBe(true);
  });

  it("rejects a whitespace-only role", () => {
    const broken = { ...OK, blocks: [{ ...BLOCK, role: "   " }] };
    expect(sectionsResponseSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a whitespace-only summary", () => {
    const broken = { ...OK, blocks: [{ ...BLOCK, summary: "   " }] };
    expect(sectionsResponseSchema.safeParse(broken).success).toBe(false);
  });

  it("accepts a section that declares it has no element", () => {
    const ok = { ...OK, blocks: [{ ...BLOCK, anchor: { noElement: true } }] };
    expect(sectionsResponseSchema.safeParse(ok).success).toBe(true);
  });

  it("accepts an anchor covering a run of siblings", () => {
    const ok = { ...OK, blocks: [{ ...BLOCK, anchor: { selector: ".sg > *", matchCount: 2 } }] };
    expect(sectionsResponseSchema.safeParse(ok).success).toBe(true);
  });

  it("rejects a section with no anchor at all, so a missing one cannot pass as noElement", () => {
    const broken = { ...OK, blocks: [{ order: 0, role: "hero", summary: "title" }] };
    expect(sectionsResponseSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects noElement set to false, which would be a third meaning", () => {
    const broken = { ...OK, blocks: [{ ...BLOCK, anchor: { noElement: false } }] };
    expect(sectionsResponseSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects an anchor that both names a selector and claims no element", () => {
    const broken = { ...OK, blocks: [{ ...BLOCK, anchor: { selector: "section", matchCount: 1, noElement: true } }] };
    expect(sectionsResponseSchema.safeParse(broken).success).toBe(false);
  });

  it("rejects a matchCount of zero", () => {
    const broken = { ...OK, blocks: [{ ...BLOCK, anchor: { selector: "section", matchCount: 0 } }] };
    expect(sectionsResponseSchema.safeParse(broken).success).toBe(false);
  });
});
