import { describe, expect, it } from "vitest";

import { projectNameFromUrl } from "../../../../src/scripts/init-project/prepare.ts";

describe("projectNameFromUrl", () => {
  it("uses the hostname with dots replaced", () => {
    expect(projectNameFromUrl("https://pearlstudio.framer.website/")).toBe("pearlstudio-framer-website");
  });

  it("drops a leading www", () => {
    expect(projectNameFromUrl("https://www.nova-x.webflow.io/")).toBe("nova-x-webflow-io");
  });
});
