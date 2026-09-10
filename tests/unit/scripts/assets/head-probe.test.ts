import { describe, expect, it } from "vitest";

import { HTTP_ERROR_STATUS_THRESHOLD } from "../../../../src/scripts/assets/constants/http.ts";
import { headProbe } from "../../../../src/scripts/assets/steps/media/utils/head-probe.ts";
import type { FetchClient, FetchResponse } from "../../../../src/lib/fetch/create-fetch-client/index.ts";

function fakeClient(respond: () => Promise<FetchResponse>): FetchClient {
  return {
    fetch: () => respond(),
    setCrawlDelayMs: () => undefined,
  };
}

function response(status: number, headers: Record<string, string>): FetchResponse {
  return {
    status,
    finalUrl: "https://example.com/asset.jpg",
    redirectChain: [],
    headers,
    body: Buffer.alloc(0),
  };
}

describe("headProbe", () => {
  it("does not trust an error page's headers", async () => {
    const client = fakeClient(() =>
      Promise.resolve(
        response(HTTP_ERROR_STATUS_THRESHOLD, {
          etag: '"error-page-etag"',
          "content-type": "text/html",
        }),
      ),
    );

    await expect(headProbe(client, "https://example.com/asset.jpg")).resolves.toEqual({
      etag: null,
      contentType: null,
    });
  });

  it("returns the etag and content-type of a successful response", async () => {
    const client = fakeClient(() =>
      Promise.resolve(
        response(HTTP_ERROR_STATUS_THRESHOLD - 1, {
          etag: '"6f7d022556d3ff514b54e0b2672773d1"',
          "content-type": "image/webp",
        }),
      ),
    );

    await expect(headProbe(client, "https://example.com/asset.jpg")).resolves.toEqual({
      etag: '"6f7d022556d3ff514b54e0b2672773d1"',
      contentType: "image/webp",
    });
  });

  it("returns the null pair when the client throws", async () => {
    const client = fakeClient(() => Promise.reject(new Error("network error")));

    await expect(headProbe(client, "https://example.com/asset.jpg")).resolves.toEqual({
      etag: null,
      contentType: null,
    });
  });
});
