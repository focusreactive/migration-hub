import { describe, expect, it } from "vitest";

import { isUtilityRoute, isUtilitySectionType } from "../../../../../src/scripts/report/analysis/utility-pages.ts";

describe("isUtilityRoute", () => {
  it("treats a route under utility-pages as a utility route", () => {
    expect(isUtilityRoute("/utility-pages/style-guide")).toBe(true);
  });

  it("treats a bare style guide slug as a utility route", () => {
    expect(isUtilityRoute("/style-guide")).toBe(true);
  });

  it("does not treat a product page as a utility route", () => {
    expect(isUtilityRoute("/about-us")).toBe(false);
  });
});

describe("isUtilitySectionType", () => {
  it("marks a type whose every member sits on utility routes", () => {
    const type = { role: "changelog-list", members: [{ route: "/utility-pages/changelog" }] };
    expect(isUtilitySectionType(type)).toBe(true);
  });

  it("marks a specimen role even on a product route", () => {
    const type = { role: "typography-specimen", members: [{ route: "/" }] };
    expect(isUtilitySectionType(type)).toBe(true);
  });

  it("does not mark a type that also appears on a product page", () => {
    const type = { role: "cta", members: [{ route: "/utility-pages/licenses" }, { route: "/" }] };
    expect(isUtilitySectionType(type)).toBe(false);
  });
});
