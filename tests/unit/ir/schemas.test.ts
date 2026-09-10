import { describe, expect, it } from "vitest";

import { mediaAssetRecordSchema } from "../../../src/ir/assets.ts";
import { pagesDataSchema } from "../../../src/ir/pages.ts";
import { discoveryTypeSchema, sectionsShardDataSchema } from "../../../src/ir/discovery.ts";

describe("pagesDataSchema", () => {
  it("accepts a page with only route and kind", () => {
    const parsed = pagesDataSchema.parse({
      pages: [{ route: "/", kind: "static" }],
      collections: [],
    });
    expect(parsed.pages[0]?.route).toBe("/");
  });

  it("rejects the dropped slug field", () => {
    expect(() =>
      pagesDataSchema.parse({ pages: [{ route: "/a", kind: "static", slug: "a" }], collections: [] }),
    ).toThrow();
  });
});

describe("mediaAssetRecordSchema", () => {
  it("allows a null etag", () => {
    const parsed = mediaAssetRecordSchema.parse({
      assetId: "0190e21a06581d29",
      canonicalUrl: "https://cdn.example.com/a.jpg",
      kind: "image",
      contentType: "image/jpeg",
      etag: null,
      sources: ["img-src"],
      duplicateOf: null,
    });
    expect(parsed.etag).toBeNull();
  });

  it("rejects the dropped size field", () => {
    expect(() =>
      mediaAssetRecordSchema.parse({
        assetId: "0190e21a06581d29",
        canonicalUrl: "https://cdn.example.com/a.jpg",
        kind: "image",
        contentType: "image/jpeg",
        etag: null,
        size: 100,
        sources: ["img-src"],
        duplicateOf: null,
      }),
    ).toThrow();
  });
});

describe("discovery schemas", () => {
  it("accepts a shard with both lists", () => {
    const parsed = sectionsShardDataSchema.parse({
      route: "/about",
      globals: [{ order: 0, role: "header", summary: "nav" }],
      blocks: [{ order: 1, role: "hero", summary: "title" }],
    });
    expect(parsed.blocks).toHaveLength(1);
  });

  it("rejects a nodeIds field that no longer exists", () => {
    expect(() =>
      sectionsShardDataSchema.parse({
        route: "/about",
        globals: [],
        blocks: [{ order: 1, role: "hero", summary: "t", nodeIds: ["mig-1"] }],
      }),
    ).toThrow();
  });

  it("rejects a non-slug type id", () => {
    expect(() =>
      discoveryTypeSchema.parse({
        id: "Feature Grid",
        name: "Feature Grid",
        role: "feature-grid",
        instanceCount: 1,
        members: [{ route: "/", order: 1 }],
        exemplar: { route: "/", order: 1 },
      }),
    ).toThrow();
  });
});
