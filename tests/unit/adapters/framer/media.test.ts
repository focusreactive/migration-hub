import { describe, expect, it } from "vitest";

import { canonicalizeFramerAssetUrl } from "../../../../src/adapters/framer/media.ts";

describe("canonicalizeFramerAssetUrl", () => {
  it("passes a bare src through unchanged", () => {
    expect(canonicalizeFramerAssetUrl("https://framerusercontent.com/images/abc.jpg")).toBe(
      "https://framerusercontent.com/images/abc.jpg",
    );
  });

  it("strips a scale-down-to resize hint", () => {
    expect(canonicalizeFramerAssetUrl("https://framerusercontent.com/images/abc.jpg?scale-down-to=512")).toBe(
      "https://framerusercontent.com/images/abc.jpg",
    );
  });

  it("strips width and height so the same file collapses to one canonical URL", () => {
    expect(
      canonicalizeFramerAssetUrl("https://framerusercontent.com/images/abc.jpg?width=3681&height=5153"),
    ).toBe("https://framerusercontent.com/images/abc.jpg");
  });
});
