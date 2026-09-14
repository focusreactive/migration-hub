import { resolveAdapter } from "#adapters/shared/resolve-adapter.ts";
import { artifactPath, readArtifact, writeArtifact } from "#ir/artifact.ts";
import { mediaAssetsArtifact, type MediaAssetsData } from "#ir/assets.ts";
import { pagesArtifact } from "#ir/pages.ts";
import { loadAssessmentConfig } from "#lib/assessment-config/index.ts";
import { createFetchClient } from "#lib/fetch/create-fetch-client/index.ts";
import { readManifest, recordArtifact, withStep } from "#lib/manifest/index.ts";
import { openMirrorStore, readOnlyClient } from "#lib/mirror-store/index.ts";
import { loadRunConfig } from "#run-config/load.ts";

import { ASSETS_MEDIA_STEP_ID } from "../../constants/ids.ts";
import { mediaNormalizerFor } from "../../media-normalizer-for.ts";

import { buildMediaAssets } from "./build-media-assets.ts";

export async function runMedia(projectPath: string, force: boolean): Promise<void> {
  const runConfig = await loadRunConfig(projectPath);
  const config = loadAssessmentConfig();

  const store = await openMirrorStore(projectPath, readOnlyClient());
  const client = createFetchClient({
    concurrency: config.crawl.concurrency,
    requestDelayMs: config.crawl.requestDelayMs,
    timeoutMs: config.crawl.timeoutMs,
    userAgent: config.crawl.userAgent,
  });

  const adapter = await resolveAdapter(projectPath);
  const normalizer = mediaNormalizerFor(adapter);

  const manifest = await readManifest(projectPath);
  const wasSkipped = manifest.steps[ASSETS_MEDIA_STEP_ID]?.status === "done" && !force;

  const computed = await withStep(
    projectPath,
    ASSETS_MEDIA_STEP_ID,
    async () => {
      const pages = await readArtifact(projectPath, pagesArtifact);
      const origin = new URL(runConfig.sourceUrl).origin;

      const data = await buildMediaAssets({
        store,
        client,
        normalizer,
        origin,
        routes: pages.pages.map((page) => page.route),
      });
      await writeArtifact(projectPath, mediaAssetsArtifact, data);
      await recordArtifact(projectPath, ASSETS_MEDIA_STEP_ID, "media", artifactPath(projectPath, mediaAssetsArtifact));

      return data;
    },
    { force },
  );

  const data: MediaAssetsData =
    wasSkipped ? await readArtifact(projectPath, mediaAssetsArtifact) : (computed as MediaAssetsData);

  console.log(
    JSON.stringify({
      step: ASSETS_MEDIA_STEP_ID,
      status: wasSkipped ? "skipped" : "done",
      images: data.assets.filter((asset) => asset.kind === "image").length,
      videos: data.assets.filter((asset) => asset.kind === "video").length,
      duplicates: data.assets.filter((asset) => asset.duplicateOf !== null).length,
    }),
  );
}
