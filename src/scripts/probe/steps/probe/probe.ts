import { createFetchClient } from "#lib/fetch/create-fetch-client/index.ts";
import { loadAssessmentConfig } from "#lib/assessment-config/index.ts";
import { readManifest, withStep } from "#lib/manifest/index.ts";
import { openMirrorStore } from "#lib/mirror-store/index.ts";
import { loadRunConfig } from "#run-config/load.ts";

import { PROBE_STEP_ID } from "../../constants/ids.ts";

import { probeSite } from "./probe-site.ts";

export async function runProbe(projectPath: string, force: boolean): Promise<void> {
  const runConfig = await loadRunConfig(projectPath);
  const config = loadAssessmentConfig();

  const client = createFetchClient({
    concurrency: config.crawl.concurrency,
    requestDelayMs: config.crawl.requestDelayMs,
    timeoutMs: config.crawl.timeoutMs,
    userAgent: config.crawl.userAgent,
  });

  const store = await openMirrorStore(projectPath, client);

  const manifest = await readManifest(projectPath);
  const wasSkipped = manifest.steps[PROBE_STEP_ID]?.status === "done" && !force;

  await withStep(
    projectPath,
    PROBE_STEP_ID,
    () => probeSite({ projectPath, sourceUrl: runConfig.sourceUrl, store, client }),
    { force },
  );

  console.log(JSON.stringify({ step: PROBE_STEP_ID, status: wasSkipped ? "skipped" : "done" }));
}
