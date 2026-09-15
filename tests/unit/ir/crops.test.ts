import { describe, expect, it } from "vitest";

import { cropIndexArtifact, cropShotRelativePath } from "../../../src/ir/crops.ts";

describe("crop artifacts", () => {
  it("places each artifact under .assessment/artifacts/crops", () => {
    expect(cropIndexArtifact.relativePath).toBe("crops/index.json");
    expect(cropShotRelativePath("site-header")).toBe("crops/shots/site-header.jpg");
  });

  it("rejects a shot whose typeId is not a type id", () => {
    expect(() =>
      cropIndexArtifact.dataSchema.parse({
        shots: [{ typeId: "Site Header", route: "/", order: 0, relativePath: "x.jpg", width: 1, height: 1 }],
        missing: [],
      }),
    ).toThrow();
  });

  it("accepts every reason a type can end up without a picture", () => {
    const index = cropIndexArtifact.dataSchema.parse({
      shots: [],
      missing: [
        { typeId: "style-guide-title", route: "/style-guide", order: 0, reason: "NO_ELEMENT" },
        { typeId: "hero", route: "/", order: 1, reason: "SECTIONS_SHARD_MISSING" },
        { typeId: "faq", route: "/", order: 2, reason: "SELECTOR_UNRESOLVED" },
        { typeId: "cta", route: "/", order: 3, reason: "SIGNATURE_DRIFT" },
        { typeId: "footer", route: "/", order: 4, reason: "CAPTURE_FAILED" },
      ],
    });

    expect(index.missing).toHaveLength(5);
  });

  it("rejects a reason that is no longer part of the vocabulary", () => {
    expect(() =>
      cropIndexArtifact.dataSchema.parse({
        shots: [],
        missing: [{ typeId: "hero", route: "/", order: 0, reason: "NO_ANCHOR_FOR_ORDER" }],
      }),
    ).toThrow();
  });
});
