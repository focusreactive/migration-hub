import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { type ArtifactDef, artifactPath, readArtifact, writeArtifact } from "../../../src/ir/artifact.ts";

const probeSchema = z.strictObject({ value: z.number() });
const probeArtifact: ArtifactDef<{ value: number }> = {
  kind: "probe",
  relativePath: "probe.json",
  dataSchema: probeSchema,
};

describe("artifact", () => {
  it("writes the data at the top level without an envelope", async () => {
    const project = await mkdtemp(join(tmpdir(), "estimate-"));
    await writeArtifact(project, probeArtifact, { value: 7 });

    const raw: unknown = JSON.parse(await readFile(artifactPath(project, probeArtifact), "utf8"));

    expect(raw).toEqual({ value: 7 });
  });

  it("reads back the data directly", async () => {
    const project = await mkdtemp(join(tmpdir(), "estimate-"));
    await writeArtifact(project, probeArtifact, { value: 7 });

    expect(await readArtifact(project, probeArtifact)).toEqual({ value: 7 });
  });

  it("rejects a payload with an unknown key", async () => {
    const project = await mkdtemp(join(tmpdir(), "estimate-"));

    await expect(
      writeArtifact(project, probeArtifact, { value: 7, extra: 1 } as unknown as { value: number }),
    ).rejects.toThrow();
  });
});
