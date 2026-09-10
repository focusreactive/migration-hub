import { describe, expect, it } from "vitest";

import type { MediaAssetRecord } from "../../../../src/ir/assets.ts";
import { applyEtagDedup, normalizeEtag } from "../../../../src/scripts/assets/steps/media/utils/dedup-by-etag.ts";

function record(over: Partial<MediaAssetRecord> & { assetId: string; canonicalUrl: string }): MediaAssetRecord {
  return {
    kind: "image",
    contentType: "image/webp",
    etag: null,
    sources: ["img-src"],
    duplicateOf: null,
    ...over,
  };
}

describe("normalizeEtag", () => {
  it("strips the surrounding quotes", () => {
    expect(normalizeEtag('"6f7d022556d3ff514b54e0b2672773d1"')).toBe("6f7d022556d3ff514b54e0b2672773d1");
  });

  it("rejects a weak etag", () => {
    expect(normalizeEtag('W/"abc"')).toBeNull();
  });

  it("rejects a multipart etag", () => {
    expect(normalizeEtag('"9b2cf5a1c4e04f0b9c1d2e3f4a5b6c7d-4"')).toBeNull();
  });

  it("passes null through", () => {
    expect(normalizeEtag(null)).toBeNull();
  });
});

describe("applyEtagDedup", () => {
  it("marks the second record with the same etag and origin as a duplicate", () => {
    const out = applyEtagDedup([
      record({
        assetId: "785a3582a2e1027b",
        canonicalUrl: "https://cdn.prod.website-files.com/a/one.webp",
        etag: "6f7d022556d3ff514b54e0b2672773d1",
      }),
      record({
        assetId: "bab7c123eb666bcf",
        canonicalUrl: "https://cdn.prod.website-files.com/b/two.webp",
        etag: "6f7d022556d3ff514b54e0b2672773d1",
      }),
    ]);

    expect(out[0]?.duplicateOf).toBeNull();
    expect(out[1]?.duplicateOf).toBe("785a3582a2e1027b");
  });

  it("does not merge across origins", () => {
    const out = applyEtagDedup([
      record({ assetId: "aaaaaaaaaaaaaaaa", canonicalUrl: "https://a.example.com/x.webp", etag: "same" }),
      record({ assetId: "bbbbbbbbbbbbbbbb", canonicalUrl: "https://b.example.com/x.webp", etag: "same" }),
    ]);

    expect(out[1]?.duplicateOf).toBeNull();
  });

  it("leaves records without an etag alone", () => {
    const out = applyEtagDedup([
      record({ assetId: "aaaaaaaaaaaaaaaa", canonicalUrl: "https://a.example.com/x.webp", etag: null }),
      record({ assetId: "bbbbbbbbbbbbbbbb", canonicalUrl: "https://a.example.com/y.webp", etag: null }),
    ]);

    expect(out.every((r) => r.duplicateOf === null)).toBe(true);
  });
});
