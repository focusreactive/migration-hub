import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { narrativeSubject } from "../../../../../src/scripts/report/steps/narrative/subject.ts";

async function writeJson(path: string, data: unknown): Promise<void> {
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

describe("narrativeSubject", () => {
  it("collects the hostname, the home screenshot and every section summary", async () => {
    const project = await mkdtemp(join(tmpdir(), "assessment-"));
    const artifacts = join(project, ".assessment", "artifacts");

    await writeJson(join(project, ".assessment", "run-config.json"), {
      sourceUrl: "https://nova-x.webflow.io/",
      projectName: "nova-x-webflow-io",
    });
    await writeJson(join(artifacts, "detect.json"), {
      verdict: "webflow",
      scores: {
        webflow: { score: 70, hasTier1Strong: true, signals: [] },
        framer: { score: 0, hasTier1Strong: false, signals: [] },
      },
      thresholds: { confidence: 50, margin: 20 },
      platformHints: {},
    });
    await writeJson(join(artifacts, "pages.json"), { pages: [{ route: "/", kind: "static" }], collections: [] });
    await writeJson(join(artifacts, "assets", "media.json"), { assets: [] });
    await writeJson(join(artifacts, "assets", "fonts.json"), { families: [] });
    await writeJson(join(artifacts, "forms.json"), { forms: [] });
    await writeJson(join(artifacts, "discovery", "blocks.json"), { types: [] });
    await writeJson(join(artifacts, "discovery", "globals.json"), { types: [] });
    await writeJson(join(artifacts, "discovery", "sections", "index.json"), {
      route: "/",
      globals: [{ order: 0, role: "footer", summary: "Dark footer with a lime newsletter card." }],
      blocks: [{ order: 1, role: "hero", summary: "Centered hero with a rounded office photo." }],
    });
    await mkdir(join(artifacts, "stitch", "index"), { recursive: true });
    await writeFile(join(artifacts, "stitch", "index", "desktop.png"), "png", "utf8");

    const subject = await narrativeSubject(project);

    expect(subject.hostname).toBe("nova-x.webflow.io");
    expect(subject.platform).toBe("Webflow");
    expect(subject.homeScreenshotPath).toBe(join(artifacts, "stitch", "index", "desktop.png"));
    expect(subject.sections).toEqual([
      { route: "/", role: "footer", summary: "Dark footer with a lime newsletter card." },
      { route: "/", role: "hero", summary: "Centered hero with a rounded office photo." },
    ]);
  });
});
