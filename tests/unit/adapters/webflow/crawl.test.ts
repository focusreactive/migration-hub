import { describe, expect, it } from "vitest";

import { crawlWebflow } from "../../../../src/adapters/webflow/crawl.ts";
import type { MirrorEntry, MirrorStore } from "../../../../src/lib/mirror-store/types.ts";

function pageEntry(url: string): MirrorEntry {
  return {
    url,
    kind: "page",
    paths: { raw: "fixture" },
    http: { status: 200, finalUrl: url, redirectChain: [] },
    sha256: "0".repeat(64),
    size: 0,
    fetchedAt: new Date().toISOString(),
  };
}

function fakeStore(pagesByUrl: Record<string, string>): MirrorStore {
  return {
    has: () => false,
    get: () => undefined,
    entries: () => [],
    fetchInto: (url) => {
      if (!(url in pagesByUrl)) {
        return Promise.reject(new Error(`no fixture for ${url}`));
      }

      return Promise.resolve(pageEntry(url));
    },
    readBody: (entry) => Promise.resolve(Buffer.from(pagesByUrl[entry.url] ?? "")),
  };
}

function webflowPageHtml(pageId: string): string {
  return `<html data-wf-page="${pageId}" data-wf-site="s1"><body></body></html>`;
}

describe("crawlWebflow truncation", () => {
  it("reports truncated when the queue still has urls at maxPages", async () => {
    const store = fakeStore({
      "https://example.com/one": webflowPageHtml("p1"),
      "https://example.com/two": webflowPageHtml("p2"),
    });

    const result = await crawlWebflow({
      origin: "https://example.com",
      seedUrls: ["https://example.com/one", "https://example.com/two"],
      store,
      maxPages: 1,
    });

    expect(result.pages).toHaveLength(1);
    expect(result.truncated).toBe(true);
  });

  it("is not truncated when every seed fits under maxPages", async () => {
    const store = fakeStore({
      "https://example.com/one": webflowPageHtml("p1"),
    });

    const result = await crawlWebflow({
      origin: "https://example.com",
      seedUrls: ["https://example.com/one"],
      store,
      maxPages: 5,
    });

    expect(result.pages).toHaveLength(1);
    expect(result.truncated).toBe(false);
  });
});
