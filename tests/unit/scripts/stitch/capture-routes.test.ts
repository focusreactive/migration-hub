import { describe, expect, it } from "vitest";

import { captureRoutes } from "../../../../src/scripts/stitch/utils/capture-routes.ts";

const PAGES = {
  pages: [
    { route: "/", kind: "static" as const },
    { route: "/about", kind: "static" as const },
    { route: "/journal/a", kind: "item" as const, collectionKey: "k1" },
    { route: "/journal/b", kind: "item" as const, collectionKey: "k1" },
  ],
  collections: [{ key: "k1", routePattern: "/journal/:slug", itemCount: 2 }],
};

describe("captureRoutes", () => {
  it("combines every static route with one exemplar per collection", () => {
    expect(captureRoutes(PAGES)).toEqual(["/", "/about", "/journal/a"]);
  });
});
