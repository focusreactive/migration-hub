import { describe, expect, it } from "vitest";

import { buildPagesData } from "../../../../src/adapters/shared/pages.ts";

describe("buildPagesData", () => {
  it("keeps only route, kind and collectionKey on a page", () => {
    const data = buildPagesData([
      { route: "/", kind: "static" },
      { route: "/journal/a", kind: "item", collectionKey: "k1", slug: "a" },
    ] as never);

    expect(data.pages).toEqual([
      { route: "/", kind: "static" },
      { route: "/journal/a", kind: "item", collectionKey: "k1" },
    ]);
  });

  it("derives a collection per collectionKey with its route pattern and item count", () => {
    const data = buildPagesData([
      { route: "/", kind: "static" },
      { route: "/journal/a", kind: "item", collectionKey: "k1", slug: "a" },
      { route: "/journal/b", kind: "item", collectionKey: "k1", slug: "b" },
    ] as never);

    expect(data.collections).toEqual([{ key: "k1", routePattern: "/journal/:slug", itemCount: 2 }]);
  });
});
