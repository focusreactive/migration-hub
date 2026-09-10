import type { FetchClient } from "#lib/fetch/create-fetch-client/index.ts";

export async function headProbe(
  client: FetchClient,
  url: string,
): Promise<{ etag: string | null; contentType: string | null }> {
  try {
    const response = await client.fetch(url, { method: "HEAD" });
    return {
      etag: response.headers["etag"] ?? null,
      contentType: response.headers["content-type"] ?? null,
    };
  } catch {
    return { etag: null, contentType: null };
  }
}
