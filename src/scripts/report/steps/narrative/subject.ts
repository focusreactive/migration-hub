import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

import { readArtifact } from "#ir/artifact.ts";
import { fontFamiliesArtifact, mediaAssetsArtifact } from "#ir/assets.ts";
import { detectArtifact } from "#ir/detect.ts";
import { discoveryBlocksArtifact, discoveryGlobalsArtifact, sectionsShardArtifactFor } from "#ir/discovery.ts";
import { formsArtifact } from "#ir/forms.ts";
import { pagesArtifact } from "#ir/pages.ts";
import { routeDir } from "#lib/route-dir.ts";
import { loadRunConfig } from "#run-config/load.ts";
import { stitchPngPath } from "#stitch/stitch.ts";
import { captureRoutes } from "#stitch/utils/capture-routes.ts";

import { computeMetrics, type ReportMetrics } from "../../analysis/metrics.ts";
import { SOURCE_LABEL } from "../../constants/labels.ts";
import { narrativeResponseRelativePath } from "../../constants/paths.ts";
import type { ReportInput } from "../../types.ts";

export interface NarrativeSubject {
  hostname: string;
  platform: string;
  homeScreenshotPath: string | null;
  sections: { route: string; role: string; summary: string }[];
  metrics: ReportMetrics;
  responsePath: string;
}

export async function narrativeSubject(projectPath: string): Promise<NarrativeSubject> {
  const runConfig = await loadRunConfig(projectPath);
  const detect = await readArtifact(projectPath, detectArtifact);
  if (detect.verdict !== "webflow" && detect.verdict !== "framer") {
    throw new Error(`the narrative step needs a recognised platform; this project's verdict is "${detect.verdict}".`);
  }

  const [pages, media, fonts, forms, blocks, globals] = await Promise.all([
    readArtifact(projectPath, pagesArtifact),
    readArtifact(projectPath, mediaAssetsArtifact),
    readArtifact(projectPath, fontFamiliesArtifact),
    readArtifact(projectPath, formsArtifact),
    readArtifact(projectPath, discoveryBlocksArtifact),
    readArtifact(projectPath, discoveryGlobalsArtifact),
  ]);

  const input: ReportInput = {
    sourceUrl: runConfig.sourceUrl,
    verdict: detect.verdict,
    pages,
    media,
    fonts,
    forms,
    blocks,
    globals,
  };

  const sections: NarrativeSubject["sections"] = [];
  for (const route of captureRoutes(pages)) {
    const shard = await readArtifact(projectPath, sectionsShardArtifactFor(routeDir(route)));
    for (const section of [...shard.globals, ...shard.blocks]) {
      sections.push({ route: shard.route, role: section.role, summary: section.summary });
    }
  }

  const home = stitchPngPath(projectPath, "/");
  const responsePath = join(projectPath, narrativeResponseRelativePath());
  await mkdir(dirname(responsePath), { recursive: true });

  return {
    hostname: new URL(runConfig.sourceUrl).hostname,
    platform: SOURCE_LABEL[detect.verdict],
    homeScreenshotPath: existsSync(home) ? home : null,
    sections,
    metrics: computeMetrics(input),
    responsePath,
  };
}

export async function runNarrativeSubject(projectPath: string): Promise<void> {
  console.log(JSON.stringify(await narrativeSubject(projectPath)));
}
