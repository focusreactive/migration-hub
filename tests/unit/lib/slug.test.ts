import { describe, expect, it } from "vitest";

import { slugifyId } from "../../../src/lib/slug.ts";

describe("slugifyId", () => {
  it("lowercases and hyphenates", () => {
    expect(slugifyId("Feature Grid")).toBe("feature-grid");
  });

  it("is stable for an already slugged value", () => {
    expect(slugifyId("hero")).toBe("hero");
  });
});
