import { describe, expect, it } from "vitest";

import { staticRoutes } from "../../../../src/scripts/stitch/utils/static-routes.ts";

const PAGES = {
  pages: [
    { route: "/", kind: "static" as const },
    { route: "/about", kind: "static" as const },
    { route: "/journal", kind: "static" as const },
    { route: "/journal/a", kind: "item" as const, collectionKey: "k1" },
    { route: "/journal/b", kind: "item" as const, collectionKey: "k1" },
  ],
  collections: [{ key: "k1", routePattern: "/journal/:slug", itemCount: 2 }],
};

describe("staticRoutes", () => {
  it("keeps every static route", () => {
    expect(staticRoutes(PAGES)).toEqual(["/", "/about", "/journal"]);
  });

  it("drops every collection item route", () => {
    expect(staticRoutes(PAGES)).not.toContain("/journal/a");
  });
});
