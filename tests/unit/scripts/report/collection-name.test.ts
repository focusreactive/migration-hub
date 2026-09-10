import { describe, expect, it } from "vitest";

import { collectionNameFromRoutePattern } from "../../../../src/scripts/report/utils/collection-name.ts";

describe("collectionNameFromRoutePattern", () => {
  it("titles a single segment", () => {
    expect(collectionNameFromRoutePattern("/journal/:slug")).toBe("Journal");
  });

  it("titles a hyphenated segment", () => {
    expect(collectionNameFromRoutePattern("/case-studies/:slug")).toBe("Case Studies");
  });

  it("uses the last static segment of a nested pattern", () => {
    expect(collectionNameFromRoutePattern("/resources/blog-posts/:slug")).toBe("Blog Posts");
  });
});
