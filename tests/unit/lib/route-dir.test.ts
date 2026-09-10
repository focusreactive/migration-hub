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

  it("normalizes accented characters to their unaccented form", () => {
    expect(routeDir("/über")).toBe("uber");
  });

  it("decodes a percent-encoded segment before normalizing", () => {
    expect(routeDir("/caf%C3%A9")).toBe("cafe");
  });

  it("maps distinct non-Latin routes to distinct directories", () => {
    const japan = routeDir("/日本");
    const korea = routeDir("/한국");
    expect(japan).not.toBe(korea);
  });
});
