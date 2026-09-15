import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { fontFamiliesDataSchema, mediaAssetsDataSchema } from "../../../../../src/ir/assets.ts";
import { discoveryBlocksDataSchema, discoveryTypesDataSchema } from "../../../../../src/ir/discovery.ts";
import { formsDataSchema } from "../../../../../src/ir/forms.ts";
import { pagesDataSchema } from "../../../../../src/ir/pages.ts";
import { createRenderContext, type RenderContext } from "../../../../../src/scripts/report/html/render-context.ts";
import type { HtmlReportInput } from "../../../../../src/scripts/report/html/types.ts";

const FIXTURE_DIR = join(process.cwd(), "tests", "fixtures", "artifacts", "pearlstudio");

async function readJson(relativePath: string): Promise<unknown> {
  return JSON.parse(await readFile(join(FIXTURE_DIR, relativePath), "utf8")) as unknown;
}

export async function loadFixtureInput(): Promise<HtmlReportInput> {
  return {
    sourceUrl: "https://pearlstudio.framer.website/",
    verdict: "framer" as const,
    pages: pagesDataSchema.parse(await readJson("pages.json")),
    media: mediaAssetsDataSchema.parse(await readJson("assets/media.json")),
    fonts: fontFamiliesDataSchema.parse(await readJson("assets/fonts.json")),
    forms: formsDataSchema.parse(await readJson("forms.json")),
    blocks: discoveryBlocksDataSchema.parse(await readJson("discovery/blocks.json")),
    globals: discoveryTypesDataSchema.parse(await readJson("discovery/globals.json")),
    narrative: {
      site: "Pearl Studio is the site of a design studio. It sells brand and product work. A third sentence.",
      design: "The design is quiet. It is typographic. It is restrained. It is monochrome. A fifth sentence.",
    },
    shards: [],
    crops: { shots: [], missing: [] },
    jpegs: new Map<string, Buffer>(),
    generatedAt: new Date(Date.UTC(2026, 8, 14)),
  };
}

export async function loadFixtureContext(): Promise<RenderContext> {
  return createRenderContext(await loadFixtureInput());
}
