import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { fontFamiliesDataSchema, mediaAssetsDataSchema } from "../../../../src/ir/assets.ts";
import { detectDataSchema } from "../../../../src/ir/detect.ts";
import { discoveryBlocksDataSchema, discoveryTypesDataSchema } from "../../../../src/ir/discovery.ts";
import { formsDataSchema } from "../../../../src/ir/forms.ts";
import { pagesDataSchema } from "../../../../src/ir/pages.ts";
import { renderReport, type ReportInput } from "../../../../src/scripts/report/render-report.ts";

const FIXTURE_DIR = join(process.cwd(), "tests", "fixtures", "artifacts", "pearlstudio");

async function readJson(relativePath: string): Promise<unknown> {
  return JSON.parse(await readFile(join(FIXTURE_DIR, relativePath), "utf8")) as unknown;
}

describe("renderReport against the pearlstudio fixture artifacts", () => {
  it("renders a report from real Task 2 artifact shapes", async () => {
    const detect = detectDataSchema.parse(await readJson("detect.json"));
    if (detect.verdict !== "webflow" && detect.verdict !== "framer") {
      throw new Error("fixture must have a recognised verdict");
    }

    const pages = pagesDataSchema.parse(await readJson("pages.json"));
    const media = mediaAssetsDataSchema.parse(await readJson("assets/media.json"));
    const fonts = fontFamiliesDataSchema.parse(await readJson("assets/fonts.json"));
    const forms = formsDataSchema.parse(await readJson("forms.json"));
    const blocks = discoveryBlocksDataSchema.parse(await readJson("discovery/blocks.json"));
    const globals = discoveryTypesDataSchema.parse(await readJson("discovery/globals.json"));

    const input: ReportInput = {
      sourceUrl: "https://pearlstudio.framer.website/",
      verdict: detect.verdict,
      pages,
      media,
      fonts,
      forms,
      blocks,
      globals,
      narrative: { site: "Pearl Studio is the site of a design studio.", design: "The design is quiet and typographic." },
    };

    const markdown = renderReport(input);

    expect(markdown).toContain("Framer");
    expect(markdown).toContain("| Journal | `/journal/:slug` | 2 |");
    expect(markdown).toContain("| Hero | 3 |");
    expect(markdown).toContain("| Header | 3 |");
    expect(markdown).toMatch(/\| Forms \| 2 \|/);

    expect(markdown).toContain("| Form | 3 (Name, Email, company) |");
    expect(markdown).toContain("## How the migration runs");
    expect(markdown).toContain("| Byline | 1 | Journal template page | Collection section |");
  });
});
