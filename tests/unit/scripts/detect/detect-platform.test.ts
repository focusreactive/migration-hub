import { describe, expect, it } from "vitest";

import { detectPlatform } from "../../../../src/scripts/detect/detect-platform.ts";
import { emptyProbeHttpSnapshot, probeFixture } from "../probe/read-probe-data.test.ts";

describe("detectPlatform", () => {
  it("returns framer for a published Framer site", async () => {
    const result = detectPlatform(await probeFixture("framer", "https://pearlstudio.framer.website/"));

    expect(result.verdict).toBe("framer");
    expect(result.scores.framer.hasTier1Strong).toBe(true);
    expect(result.scores.framer.score).toBeGreaterThan(result.scores.webflow.score);
  });

  it("returns webflow for a published Webflow site", async () => {
    const result = detectPlatform(await probeFixture("webflow", "https://nova-x.webflow.io/"));

    expect(result.verdict).toBe("webflow");
    expect(result.platformHints.webflowSiteId).toBeTypeOf("string");
  });

  it("returns unknown for a page with no platform markers", () => {
    const result = detectPlatform({
      sourceUrl: "https://example.com/",
      homeHtml: "<html><head><title>Plain</title></head><body><h1>Plain</h1></body></html>",
      homeHttp: emptyProbeHttpSnapshot(200),
    });

    expect(result.verdict).toBe("unknown");
  });
});
