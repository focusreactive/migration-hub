import { describe, expect, it } from "vitest";

import { collectionExemplarRoutes } from "../../../../src/scripts/stitch/utils/collection-exemplar-routes.ts";

const PAGES = {
  pages: [
    { route: "/", kind: "static" as const },
    { route: "/journal/a", kind: "item" as const, collectionKey: "k1" },
    { route: "/journal/b", kind: "item" as const, collectionKey: "k1" },
    { route: "/team/x", kind: "item" as const, collectionKey: "k2" },
  ],
  collections: [
    { key: "k1", routePattern: "/journal/:slug", itemCount: 2 },
    { key: "k2", routePattern: "/team/:slug", itemCount: 1 },
  ],
};

describe("collectionExemplarRoutes", () => {
  it("picks one route per collection", () => {
    expect(collectionExemplarRoutes(PAGES)).toEqual(["/journal/a", "/team/x"]);
  });

  it("drops every static route", () => {
    expect(collectionExemplarRoutes(PAGES)).not.toContain("/");
  });

  it("returns nothing for a site with no collections", () => {
    const pages = { pages: [{ route: "/", kind: "static" as const }], collections: [] };
    expect(collectionExemplarRoutes(pages)).toEqual([]);
  });
});
