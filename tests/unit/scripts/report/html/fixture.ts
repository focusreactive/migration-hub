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

// A minimal but valid JPEG (SOI immediately followed by EOI) — nothing in these tests
// decodes pixel content, only checks the bytes are embedded as a base64 data URI.
const TINY_JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

// The one real typeId this fixture wires a crop, shard summary, and jpeg for. "hero"
// is a block type in discovery/blocks.json with exemplar { route: "/", order: 0 } —
// a route the base fixture's pages.json also carries — so the crop, the shard section,
// and the type all agree on the same route/order.
export const CROPPED_TYPE_ID = "hero";
export const CROPPED_TYPE_SUMMARY = "A quiet, full-bleed hero photograph introduces the studio.";

// loadFixtureInput() always builds an empty shards/crops/jpegs input (other tests, e.g.
// the "degrades every screenshot to a placeholder" regression, depend on that empty
// path staying empty) so the one whole-document integration test never exercises a
// real screenshot, a real SHOTS entry, or a real summary. This variant overrides those
// three fields with realistic non-empty values, reusing everything else from the base
// fixture.
export async function loadFixtureInputWithCrops(): Promise<HtmlReportInput> {
  const base = await loadFixtureInput();

  return {
    ...base,
    shards: [
      {
        route: "/",
        globals: [],
        blocks: [{ order: 0, role: "hero", summary: CROPPED_TYPE_SUMMARY }],
      },
    ],
    crops: {
      shots: [{ typeId: CROPPED_TYPE_ID, route: "/", order: 0, relativePath: "crops/hero.jpg", width: 4, height: 3 }],
      missing: [],
    },
    jpegs: new Map<string, Buffer>([[CROPPED_TYPE_ID, TINY_JPEG]]),
  };
}
