import { describe, expect, it } from "vitest";

import { pageLabel } from "../../../../src/scripts/report/utils/page-label.ts";

describe("pageLabel", () => {
  it("labels the home route", () => {
    expect(pageLabel("/")).toEqual({ name: "Home", slug: "/" });
  });

  it("labels a single segment route", () => {
    expect(pageLabel("/about")).toEqual({ name: "About", slug: "about" });
  });

  it("labels a nested route by its last segment", () => {
    expect(pageLabel("/legal/privacy-policy")).toEqual({ name: "Privacy Policy", slug: "privacy-policy" });
  });
});
