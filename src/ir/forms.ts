import { z } from "zod";

import type { ArtifactDef } from "#ir/artifact.ts";

export const formFieldSchema = z.strictObject({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
});

export const formRecordSchema = z.strictObject({
  route: z.string(),
  name: z.string().nullable(),
  action: z.string().nullable(),
  method: z.string(),
  fieldCount: z.number().int().nonnegative(),
  fields: z.array(formFieldSchema),
});

export const formsDataSchema = z.strictObject({
  forms: z.array(formRecordSchema),
});

export type FormField = z.infer<typeof formFieldSchema>;
export type FormRecord = z.infer<typeof formRecordSchema>;
export type FormsData = z.infer<typeof formsDataSchema>;

export const formsArtifact: ArtifactDef<FormsData> = {
  kind: "forms",
  relativePath: "forms.json",
  dataSchema: formsDataSchema,
};
