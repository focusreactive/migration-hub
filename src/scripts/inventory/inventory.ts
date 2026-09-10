import { buildPagesData } from "#adapters/shared/pages.ts";
import { resolveAdapter } from "#adapters/shared/resolve-adapter.ts";
import { collectSitemapUrls } from "#adapters/shared/sitemap-collect.ts";
import { artifactPath, readArtifact, writeArtifact } from "#ir/artifact.ts";
import { detectArtifact } from "#ir/detect.ts";
import { pagesArtifact, type PagesData } from "#ir/pages.ts";
import { loadEstimateConfig } from "#lib/estimate-config/index.ts";
import { createFetchClient } from "#lib/fetch/create-fetch-client/index.ts";
import { readManifest, recordArtifact, withStep } from "#lib/manifest/index.ts";
import { openMirrorStore } from "#lib/mirror-store/index.ts";
import { readProbeData } from "#probe/read-probe-data.ts";
import { loadRunConfig } from "#run-config/load.ts";

import { INVENTORY_STEP_ID } from "./constants/ids.ts";
import { inventoryCrawlerFor } from "./inventory-crawler-for.ts";

export async function runInventory(projectPath: string, force: boolean): Promise<void> {
  const runConfig = await loadRunConfig(projectPath);
  const config = loadEstimateConfig();

  const client = createFetchClient({
    concurrency: config.crawl.concurrency,
    requestDelayMs: config.crawl.requestDelayMs,
    timeoutMs: config.crawl.timeoutMs,
    userAgent: config.crawl.userAgent,
  });

  const store = await openMirrorStore(projectPath, client);

  const adapter = await resolveAdapter(projectPath);
  const crawl = inventoryCrawlerFor(adapter);

  const manifest = await readManifest(projectPath);
  const wasSkipped = manifest.steps[INVENTORY_STEP_ID]?.status === "done" && !force;

  const computed = await withStep(
    projectPath,
    INVENTORY_STEP_ID,
    async () => {
      const probe = await readProbeData(projectPath);
      const detect = await readArtifact(projectPath, detectArtifact);
      const origin = new URL(runConfig.sourceUrl).origin;

      const sitemapUrls = await collectSitemapUrls({
        rootSitemapXml: probe.sitemapXml,
        store,
      });

      const { pages } = await crawl({
        origin,
        sourceUrl: runConfig.sourceUrl,
        sitemapUrls,
        platformHints: detect.platformHints,
        store,
        maxPages: config.crawl.maxPages,
      });

      const data = buildPagesData(pages);
      await writeArtifact(projectPath, pagesArtifact, data);
      await recordArtifact(projectPath, INVENTORY_STEP_ID, "pages", artifactPath(projectPath, pagesArtifact));

      return data;
    },
    { force },
  );

  const data: PagesData = wasSkipped ? await readArtifact(projectPath, pagesArtifact) : (computed as PagesData);

  console.log(
    JSON.stringify({
      step: INVENTORY_STEP_ID,
      status: wasSkipped ? "skipped" : "done",
      pages: data.pages.length,
      collections: data.collections.length,
    }),
  );
}
