import { describe, expect, it } from "vitest";

import { buildSectionIndex, summaryForType } from "../../../../../src/scripts/report/html/utils/section-index.ts";

const PAGES = {
  pages: [
    { route: "/", kind: "static" as const },
    { route: "/blog/first", kind: "item" as const, collectionKey: "blog" },
    { route: "/blog/second", kind: "item" as const, collectionKey: "blog" },
  ],
  collections: [{ key: "blog", routePattern: "/blog/:slug", itemCount: 2 }],
};

const GLOBALS = {
  types: [
    {
      id: "site-header",
      name: "Site header",
      role: "header",
      instanceCount: 2,
      members: [
        { route: "/blog/first", order: 0 },
        { route: "/", order: 0 },
      ],
      exemplar: { route: "/", order: 0 },
    },
  ],
};

const BLOCKS = {
  types: [
    {
      id: "hero",
      name: "Home hero",
      role: "hero",
      instanceCount: 1,
      members: [{ route: "/", order: 1 }],
      exemplar: { route: "/", order: 1 },
      kinds: ["block" as const],
    },
    {
      id: "post-body",
      name: "Blog post body",
      role: "body",
      instanceCount: 1,
      members: [{ route: "/blog/first", order: 1 }],
      exemplar: { route: "/blog/first", order: 1 },
      kinds: ["collectionSection" as const],
    },
  ],
};

describe("buildSectionIndex", () => {
  it("lists every unique layout page, page-builder pages first", () => {
    const index = buildSectionIndex({ pages: PAGES, blocks: BLOCKS, globals: GLOBALS });

    expect(index.map((page) => page.route)).toEqual(["/", "/blog/first"]);
    expect(index.map((page) => page.title)).toEqual(["Home", "Blog template page"]);
    expect(index.map((page) => page.isCollectionTemplate)).toEqual([false, true]);
  });

  it("puts each page's sections in order with the type they belong to", () => {
    const index = buildSectionIndex({ pages: PAGES, blocks: BLOCKS, globals: GLOBALS });

    expect(index[0]?.sections).toEqual([
      { order: 0, typeId: "site-header", name: "Site header", isGlobal: true },
      { order: 1, typeId: "hero", name: "Home hero", isGlobal: false },
    ]);
  });

  it("marks globals apart from blocks", () => {
    const index = buildSectionIndex({ pages: PAGES, blocks: BLOCKS, globals: GLOBALS });

    expect(index[1]?.sections.map((section) => section.isGlobal)).toEqual([true, false]);
  });
});

describe("summaryForType", () => {
  const SHARDS = [
    {
      route: "/",
      globals: [{ order: 0, role: "header", summary: "Sticky top bar with the wordmark.", anchor: null }],
      blocks: [{ order: 1, role: "hero", summary: "Full-width photo with a headline.", anchor: null }],
    },
  ];

  it("returns the exemplar instance's summary", () => {
    expect(summaryForType({ typeId: "hero", blocks: BLOCKS, globals: GLOBALS, shards: SHARDS })).toBe(
      "Full-width photo with a headline.",
    );
  });

  it("reads global summaries too", () => {
    expect(summaryForType({ typeId: "site-header", blocks: BLOCKS, globals: GLOBALS, shards: SHARDS })).toBe(
      "Sticky top bar with the wordmark.",
    );
  });

  it("returns undefined when no shard covers the exemplar", () => {
    expect(summaryForType({ typeId: "post-body", blocks: BLOCKS, globals: GLOBALS, shards: SHARDS })).toBeUndefined();
  });
});
