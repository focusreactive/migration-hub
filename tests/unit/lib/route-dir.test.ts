import { describe, expect, it } from "vitest";

import { routeDir } from "../../../src/lib/route-dir.ts";

describe("routeDir", () => {
  it("maps the home route to index", () => {
    expect(routeDir("/")).toBe("index");
  });

  it("keeps a single segment as is", () => {
    expect(routeDir("/about")).toBe("about");
  });

  it("keeps nested segments", () => {
    expect(routeDir("/journal/why-good-design-wins")).toBe("journal/why-good-design-wins");
  });
});
