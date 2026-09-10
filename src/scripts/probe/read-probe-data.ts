import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { loadRunConfig } from "#run-config/load.ts";
import { openMirrorStore, readOnlyClient } from "#lib/mirror-store/index.ts";
import { MIRROR_DIR } from "#lib/mirror-store/paths.ts";
import type { MirrorEntry, MirrorStore } from "#lib/mirror-store/types.ts";

import { HTTP_ERROR_STATUS_THRESHOLD } from "./constants/http.ts";
import { PROBE_PATHS } from "./constants/paths.ts";
import type { ProbeHttpSnapshot } from "./types.ts";

export interface ProbeData {
  sourceUrl: string;
  homeHtml: string;
  homeHttp: ProbeHttpSnapshot;
  robotsTxt?: string;
  sitemapXml?: string;
  notFound?: { html: string; status: number };
}

function findByRelativePath(store: MirrorStore, relativePath: string): MirrorEntry | undefined {
  const matches = store.entries().filter((entry) => entry.paths.raw === relativePath);

  return matches.find((entry) => entry.http.status < HTTP_ERROR_STATUS_THRESHOLD) ?? matches[0];
}

async function readOkBody(store: MirrorStore, entry: MirrorEntry | undefined): Promise<string | undefined> {
  if (!entry || entry.http.status >= HTTP_ERROR_STATUS_THRESHOLD) {
    return undefined;
  }
  return (await store.readBody(entry)).toString("utf8");
}

export async function readProbeData(projectPath: string): Promise<ProbeData> {
  const [runConfig, store] = await Promise.all([
    loadRunConfig(projectPath),
    openMirrorStore(projectPath, readOnlyClient()),
  ]);

  const homeEntry = findByRelativePath(store, PROBE_PATHS.home);
  if (!homeEntry) {
    throw new Error(`probe has not been run for this project: ${projectPath}`);
  }

  const homeHtml = (await store.readBody(homeEntry)).toString("utf8");
  const homeHttp = JSON.parse(
    await readFile(join(projectPath, MIRROR_DIR, PROBE_PATHS.headers), "utf8"),
  ) as ProbeHttpSnapshot;

  const robotsTxt = await readOkBody(store, findByRelativePath(store, PROBE_PATHS.robots));
  const sitemapXml = await readOkBody(store, findByRelativePath(store, PROBE_PATHS.sitemap));

  const notFoundEntry = findByRelativePath(store, PROBE_PATHS.notFound);
  const notFound =
    notFoundEntry ?
      {
        html: (await store.readBody(notFoundEntry)).toString("utf8"),
        status: notFoundEntry.http.status,
      }
    : undefined;

  return {
    sourceUrl: runConfig.sourceUrl,
    homeHtml,
    homeHttp,
    ...(robotsTxt !== undefined && { robotsTxt }),
    ...(sitemapXml !== undefined && { sitemapXml }),
    ...(notFound !== undefined && { notFound }),
  };
}
