import { describe, expect, it } from "vitest";

import { createLinker } from "../../../../../src/scripts/report/html/utils/page-links.ts";

const PAGES = {
  pages: [
    { route: "/", kind: "static" as const },
    { route: "/about-us", kind: "static" as const },
    { route: "/case-studies/glowessence-skincare", kind: "item" as const, collectionKey: "cs" },
    { route: "/case-studies/northwind", kind: "item" as const, collectionKey: "cs" },
  ],
  collections: [{ key: "cs", routePattern: "/case-studies/:slug", itemCount: 2 }],
};

const linker = createLinker({ sourceUrl: "https://nova-x.webflow.io/", pages: PAGES });

describe("createLinker", () => {
  it("shows the home route as /home", () => {
    expect(linker.displayPath("/")).toBe("/home");
    expect(linker.displayPath("/about-us")).toBe("/about-us");
  });

  it("builds an absolute href on the source origin", () => {
    expect(linker.href("/about-us")).toBe("https://nova-x.webflow.io/about-us");
    expect(linker.href("/")).toBe("https://nova-x.webflow.io/");
  });

  it("renders the design's path anchor", () => {
    expect(linker.anchor("/about-us")).toBe(
      '<a class="mono pathlink" href="https://nova-x.webflow.io/about-us" target="_blank" rel="noreferrer"'
        + ' title="Open /about-us on nova-x.webflow.io">/about-us</a>',
    );
  });

  it("labels a collection with its pattern but links to a real document", () => {
    const anchor = linker.collectionAnchor("cs");

    expect(anchor).toContain(">/case-studies/:slug<");
    expect(anchor).toContain('href="https://nova-x.webflow.io/case-studies/glowessence-skincare"');
    expect(anchor).toContain('title="Example document · /case-studies/glowessence-skincare"');
  });

  it("resolves an item route to its collection anchor", () => {
    expect(linker.routeAnchor("/case-studies/northwind")).toBe(linker.collectionAnchor("cs"));
  });

  it("resolves a static route to a plain page anchor", () => {
    expect(linker.routeAnchor("/about-us")).toBe(linker.anchor("/about-us"));
  });

  it("escapes a route containing markup characters", () => {
    expect(linker.anchor('/a"b')).not.toContain('"b"');
  });

  it("renders a documentless collection as plain text, not a link", () => {
    const empty = createLinker({
      sourceUrl: "https://nova-x.webflow.io/",
      pages: { pages: [], collections: [{ key: "jobs", routePattern: "/jobs/:slug", itemCount: 0 }] },
    });

    const rendered = empty.collectionAnchor("jobs");

    expect(rendered).toBe(
      '<span class="mono pathlink" title="No documents published · /jobs/:slug">/jobs/:slug</span>',
    );
    expect(rendered).not.toContain("<a ");
  });

  it("throws when a collection key has no collection", () => {
    expect(() => linker.collectionAnchor("nope")).toThrow(/no collection with key/);
  });
});
