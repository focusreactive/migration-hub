import { describe, expect, it } from "vitest";

import { countLabel } from "../../../../../src/scripts/report/utils/count.ts";

describe("countLabel", () => {
  it("spells out a single item and keeps the singular noun", () => {
    expect(countLabel(1, "font family", "font families")).toBe("one font family");
  });

  it("uses digits and the plural noun for anything else", () => {
    expect(countLabel(3, "collection template", "collection templates")).toBe("3 collection templates");
  });

  it("uses digits and the plural noun for zero", () => {
    expect(countLabel(0, "form", "forms")).toBe("0 forms");
  });
});
