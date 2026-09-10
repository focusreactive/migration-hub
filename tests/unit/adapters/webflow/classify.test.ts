import { describe, expect, it } from "vitest";

import { classifyWebflowPage } from "../../../../src/adapters/webflow/classify.ts";

describe("classifyWebflowPage", () => {
  it("classifies a static webflow page", () => {
    const html = `<html data-wf-page="p1" data-wf-site="s1"><body>static</body></html>`;

    expect(classifyWebflowPage(html)).toEqual({
      isWebflow: true,
      kind: "static",
      pageId: "p1",
    });
  });

  it("classifies a collection-item page", () => {
    const html = `<html data-wf-page="p2" data-wf-site="s1" data-wf-collection="c1"><body>item</body></html>`;

    expect(classifyWebflowPage(html)).toEqual({
      isWebflow: true,
      kind: "item",
      collectionKey: "c1",
      pageId: "p2",
    });
  });

  it("reports a page with no webflow markers as non-webflow", () => {
    const html = `<html><body>plain</body></html>`;

    expect(classifyWebflowPage(html)).toEqual({
      isWebflow: false,
      kind: "static",
    });
  });
});
