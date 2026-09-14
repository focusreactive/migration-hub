import { describe, expect, it } from "vitest";

import { narrativeArtifact, narrativeDataSchema } from "../../../src/ir/narrative.ts";

describe("narrativeDataSchema", () => {
  it("accepts two non-empty paragraphs", () => {
    const parsed = narrativeDataSchema.parse({ site: "A marketing site.", design: "Quiet and monochrome." });
    expect(parsed.site).toBe("A marketing site.");
  });

  it("rejects an empty paragraph", () => {
    expect(() => narrativeDataSchema.parse({ site: "", design: "x" })).toThrow();
  });

  it("rejects unknown keys", () => {
    expect(() => narrativeDataSchema.parse({ site: "a", design: "b", extra: "c" })).toThrow();
  });

  it("writes under the report directory", () => {
    expect(narrativeArtifact.relativePath).toBe("report/narrative.json");
  });
});
