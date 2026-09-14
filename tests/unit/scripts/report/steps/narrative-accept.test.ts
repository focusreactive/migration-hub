import { access, mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

import { readManifest } from "#lib/manifest/index.ts";

import {
  REPORT_NARRATIVE_ACCEPT_STEP_ID,
  REPORT_NARRATIVE_JUDGE_STEP_ID,
  REPORT_NARRATIVE_SUBJECT_STEP_ID,
} from "../../../../../src/scripts/report/constants/ids.ts";
import { runNarrativeAccept } from "../../../../../src/scripts/report/steps/narrative/accept.ts";

async function project(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "assessment-"));
  await mkdir(join(dir, ".assessment"), { recursive: true });
  await writeFile(
    join(dir, ".assessment", "manifest.json"),
    `${JSON.stringify({ schemaVersion: 1, toolVersion: "0.1.0", sourceUrl: "https://x.webflow.io/", steps: {} }, null, 2)}\n`,
    "utf8",
  );
  return dir;
}

async function writeResponse(dir: string, data: unknown): Promise<void> {
  const path = join(dir, ".assessment", "steps", "report", "narrative", "response.json");
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, `${JSON.stringify(data)}\n`, "utf8");
}

async function expectNoArtifact(dir: string): Promise<void> {
  await expect(
    access(join(dir, ".assessment", "artifacts", "report", "narrative.json")),
  ).rejects.toThrow();
}

describe("runNarrativeAccept", () => {
  it("writes the artifact for two clean paragraphs", async () => {
    const dir = await project();
    await writeResponse(dir, {
      site: "Nova X is the marketing site of a digital-marketing agency.",
      design: "The design is contemporary and deliberately quiet.",
    });

    await runNarrativeAccept(dir);

    const written = JSON.parse(
      await readFile(join(dir, ".assessment", "artifacts", "report", "narrative.json"), "utf8"),
    ) as { site: string };
    expect(written.site).toContain("Nova X");

    const manifest = await readManifest(dir);
    expect(manifest.steps[REPORT_NARRATIVE_SUBJECT_STEP_ID]?.status).toBe("done");
    expect(manifest.steps[REPORT_NARRATIVE_JUDGE_STEP_ID]?.status).toBe("done");
    expect(manifest.steps[REPORT_NARRATIVE_ACCEPT_STEP_ID]?.status).toBe("done");
  });

  it("rejects counters in the site paragraph and writes nothing", async () => {
    const dir = await project();
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await writeResponse(dir, {
      site: "A marketing site with 22 pages and 3 collections.",
      design: "Quiet and monochrome.",
    });

    await runNarrativeAccept(dir);

    expect(log.mock.calls.at(0)?.at(0)).toContain('"ok":false');
    await expectNoArtifact(dir);
    log.mockRestore();
  });

  it("rejects agency voice and writes nothing", async () => {
    const dir = await project();
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await writeResponse(dir, {
      site: "Nova X is the marketing site of a digital-marketing agency.",
      design: "We kept the design contemporary and deliberately quiet.",
    });

    await runNarrativeAccept(dir);

    expect(log.mock.calls.at(0)?.at(0)).toContain('"AGENCY_VOICE"');
    await expectNoArtifact(dir);
    log.mockRestore();
  });

  it("rejects a filler opening in the site paragraph and writes nothing", async () => {
    const dir = await project();
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await writeResponse(dir, {
      site: "This site is the marketing site of a digital-marketing agency.",
      design: "The design is contemporary and deliberately quiet.",
    });

    await runNarrativeAccept(dir);

    const payload = JSON.parse(log.mock.calls.at(0)?.at(0) as string) as {
      ok: boolean;
      errors: { code: string; where: string }[];
    };
    expect(payload.ok).toBe(false);
    expect(payload.errors).toContainEqual(expect.objectContaining({ code: "FILLER_OPENING", where: "site" }));
    await expectNoArtifact(dir);
    log.mockRestore();
  });

  it("rejects a filler opening in the design paragraph and writes nothing", async () => {
    const dir = await project();
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await writeResponse(dir, {
      site: "Nova X is the marketing site of a digital-marketing agency.",
      design: "This site uses a contemporary and deliberately quiet design.",
    });

    await runNarrativeAccept(dir);

    const payload = JSON.parse(log.mock.calls.at(0)?.at(0) as string) as {
      ok: boolean;
      errors: { code: string; where: string }[];
    };
    expect(payload.ok).toBe(false);
    expect(payload.errors).toContainEqual(expect.objectContaining({ code: "FILLER_OPENING", where: "design" }));
    await expectNoArtifact(dir);
    log.mockRestore();
  });

  it("rejects a response that fails the schema and writes nothing", async () => {
    const dir = await project();
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    await writeResponse(dir, {
      site: "Nova X is the marketing site of a digital-marketing agency.",
      extra: "not part of the schema",
    });

    await runNarrativeAccept(dir);

    expect(log.mock.calls.at(0)?.at(0)).toContain('"SCHEMA"');
    await expectNoArtifact(dir);
    log.mockRestore();
  });
});
