import { describe, expect, it } from "vitest";

import { mirrorPath, pageMirrorPathForRoute } from "../../../../src/lib/mirror-store/paths.ts";

describe("pageMirrorPathForRoute", () => {
  it("maps the home route", () => {
    expect(pageMirrorPathForRoute("/")).toBe("pages/index.html");
  });

  it("maps a nested route", () => {
    expect(pageMirrorPathForRoute("/journal/a-post")).toBe("pages/journal/a-post/index.html");
  });
});

describe("mirrorPath", () => {
  it("puts a stylesheet under styles", () => {
    expect(mirrorPath("style", "https://cdn.example.com/site.min.css")).toBe("styles/site.min.css");
  });
});
