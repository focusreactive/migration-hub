import type { FetchClient, FetchResponse } from "#lib/fetch/create-fetch-client/index.ts";
import type { MirrorStore } from "#lib/mirror-store/types.ts";

import { PROBE_PATHS } from "../../constants/paths.ts";

import { fetchProbeTargets } from "./fetch-probe-targets.ts";
import { writeHomeHeaders } from "./write-home-headers.ts";

export async function probeSite(opts: {
  projectPath: string;
  sourceUrl: string;
  store: MirrorStore;
  client: FetchClient;
}): Promise<void> {
  const { projectPath, sourceUrl, store, client } = opts;

  await fetchProbeTargets({
    sourceUrl,
    client,
    fetch: async (url, relativePath) => {
      let response: FetchResponse | undefined;
      const entry = await store.fetchInto(url, "probe", {
        relativePath,
        onResponse: (r) => {
          response = r;
        },
      });

      if (response !== undefined && relativePath === PROBE_PATHS.home) {
        await writeHomeHeaders(projectPath, response);
      }

      return {
        status: entry.http.status,
        readBody: () => store.readBody(entry),
      };
    },
  });
}
