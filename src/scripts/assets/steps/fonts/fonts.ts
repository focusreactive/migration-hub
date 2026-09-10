import { artifactPath, readArtifact, writeArtifact } from "#ir/artifact.ts";
import { fontFamiliesArtifact, type FontFamiliesData } from "#ir/assets.ts";
import { pagesArtifact } from "#ir/pages.ts";
import { readManifest, recordArtifact, withStep } from "#lib/manifest/index.ts";
import { openMirrorStore, readOnlyClient } from "#lib/mirror-store/index.ts";
import { loadRunConfig } from "#run-config/load.ts";

import { ASSETS_FONTS_STEP_ID } from "../../constants/ids.ts";

import { buildFontFamilies, type ParsedFace } from "./build-font-families.ts";
import { parseFontFaces, providerStylesheetUrls } from "./parse-font-faces.ts";

export async function runFonts(projectPath: string, force: boolean): Promise<void> {
  const runConfig = await loadRunConfig(projectPath);
  const store = await openMirrorStore(projectPath, readOnlyClient());

  const manifest = await readManifest(projectPath);
  const wasSkipped = manifest.steps[ASSETS_FONTS_STEP_ID]?.status === "done" && !force;

  const computed = await withStep(
    projectPath,
    ASSETS_FONTS_STEP_ID,
    async () => {
      const pages = await readArtifact(projectPath, pagesArtifact);
      const origin = new URL(runConfig.sourceUrl).origin;

      const faces: ParsedFace[] = [];
      const providerHosts = new Set<string>();

      for (const page of pages.pages) {
        const entry = store.get(new URL(page.route, origin).toString());
        if (entry === undefined) continue;

        const html = (await store.readBody(entry)).toString("utf8");
        faces.push(...parseFontFaces(html, entry.url));

        for (const url of providerStylesheetUrls(html, entry.url)) {
          try {
            providerHosts.add(new URL(url).hostname);
          } catch {
            continue;
          }
        }
      }

      for (const entry of store.entries().filter((candidate) => candidate.kind === "style")) {
        const css = (await store.readBody(entry)).toString("utf8");
        faces.push(...parseFontFaces(css, entry.url));
      }

      const data: FontFamiliesData = { families: buildFontFamilies(faces, [...providerHosts]) };
      await writeArtifact(projectPath, fontFamiliesArtifact, data);
      await recordArtifact(projectPath, ASSETS_FONTS_STEP_ID, "fonts", artifactPath(projectPath, fontFamiliesArtifact));

      return data;
    },
    { force },
  );

  const data: FontFamiliesData =
    wasSkipped ? await readArtifact(projectPath, fontFamiliesArtifact) : (computed as FontFamiliesData);

  console.log(
    JSON.stringify({
      step: ASSETS_FONTS_STEP_ID,
      status: wasSkipped ? "skipped" : "done",
      families: data.families.length,
    }),
  );
}
