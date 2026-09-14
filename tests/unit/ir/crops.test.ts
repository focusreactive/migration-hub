import { describe, expect, it } from "vitest";

import {
  cropAnchorsShardArtifactFor,
  cropCandidatesShardArtifactFor,
  cropIndexArtifact,
  cropShotRelativePath,
} from "../../../src/ir/crops.ts";

describe("crop artifacts", () => {
  it("places each artifact under .assessment/artifacts/crops", () => {
    expect(cropCandidatesShardArtifactFor("about-us").relativePath).toBe("crops/candidates/about-us.json");
    expect(cropAnchorsShardArtifactFor("about-us").relativePath).toBe("crops/anchors/about-us.json");
    expect(cropIndexArtifact.relativePath).toBe("crops/index.json");
    expect(cropShotRelativePath("site-header")).toBe("crops/shots/site-header.jpg");
  });

  it("accepts a well-formed candidates shard", () => {
    const shard = cropCandidatesShardArtifactFor("index").dataSchema.parse({
      route: "/",
      viewportWidth: 1440,
      candidates: [
        {
          index: 0,
          y: 0,
          height: 60,
          tag: "header",
          classes: ["nav"],
          textSnippet: "Home About",
          isFixed: true,
          signature: "header.nav|60|Home About",
        },
      ],
    });

    expect(shard.candidates[0]?.isFixed).toBe(true);
  });

  it("rejects a shot whose typeId is not a type id", () => {
    expect(() =>
      cropIndexArtifact.dataSchema.parse({
        shots: [{ typeId: "Site Header", route: "/", order: 0, relativePath: "x.jpg", width: 1, height: 1 }],
        missing: [],
      }),
    ).toThrow();
  });

  it("rejects an anchors shard with a negative candidate index", () => {
    expect(() =>
      cropAnchorsShardArtifactFor("index").dataSchema.parse({
        route: "/",
        anchors: [{ order: 0, candidateIndex: -1 }],
        unmappable: [],
      }),
    ).toThrow();
  });
});
