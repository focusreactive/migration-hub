import { join } from "node:path";

import { z } from "zod";

import type { ArtifactDef } from "#ir/artifact.ts";

export const narrativeDataSchema = z.strictObject({
  site: z.string().min(1),
  design: z.string().min(1),
});

export type NarrativeData = z.infer<typeof narrativeDataSchema>;

export const narrativeArtifact: ArtifactDef<NarrativeData> = {
  kind: "report-narrative",
  relativePath: join("report", "narrative.json"),
  dataSchema: narrativeDataSchema,
};
