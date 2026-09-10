import { describe, expect, it } from "vitest";

import { sectionsResponseSchema } from "../../../../src/scripts/discovery/schemas/sections-response.ts";

const BLOCK = { order: 0, role: "hero", summary: "title and subtitle" };
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
});
