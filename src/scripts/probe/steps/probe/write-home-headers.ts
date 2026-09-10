import { join } from "node:path";

import type { FetchResponse } from "#lib/fetch/create-fetch-client/index.ts";
import { writeFileAtomic } from "#lib/fs.ts";
import { MIRROR_DIR } from "#lib/mirror-store/paths.ts";

import { PROBE_PATHS } from "../../constants/paths.ts";
import type { ProbeHttpSnapshot } from "../../types.ts";

export function toProbeHttpSnapshot(response: FetchResponse): ProbeHttpSnapshot {
  return {
    status: response.status,
    finalUrl: response.finalUrl,
    redirectChain: response.redirectChain,
    headers: response.headers,
  };
}

export async function writeHomeHeaders(projectPath: string, response: FetchResponse): Promise<void> {
  await writeFileAtomic(
    join(projectPath, MIRROR_DIR, PROBE_PATHS.headers),
    `${JSON.stringify(toProbeHttpSnapshot(response), null, 2)}\n`,
  );
}
