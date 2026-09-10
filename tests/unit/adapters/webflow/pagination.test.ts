import { describe, expect, it } from "vitest";

import { findPaginations, paginationUrls } from "../../../../src/adapters/webflow/pagination.ts";

describe("findPaginations", () => {
  it("finds a paginated dynamic list via the _page= convention", () => {
    const html = `
      <div class="w-dyn-list">
        <div class="w-dyn-items"></div>
        <div class="w-pagination-wrapper">
          <a class="w-pagination-next" href="/works?works_page=2">Next</a>
          <div class="w-page-count">Page 1 / 3</div>
        </div>
      </div>
    `;

    expect(findPaginations(html)).toEqual([{ seed: "works", pageCount: 3 }]);
  });

  it("returns nothing for a dynamic list with no pagination wrapper", () => {
    const html = `
      <div class="w-dyn-list">
        <div class="w-dyn-items"></div>
      </div>
    `;

    expect(findPaginations(html)).toEqual([]);
  });
});

describe("paginationUrls", () => {
  it("builds one url per page after the first", () => {
    const urls = paginationUrls("https://example.com/works", { seed: "works", pageCount: 3 });

    expect(urls).toEqual(["https://example.com/works?works_page=2", "https://example.com/works?works_page=3"]);
  });

  it("returns no urls when there is only one page", () => {
    expect(paginationUrls("https://example.com/works", { seed: "works", pageCount: 1 })).toEqual([]);
  });
});
