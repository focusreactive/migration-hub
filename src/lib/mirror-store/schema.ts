import { z } from "zod";

export const mirrorEntrySchema = z.strictObject({
  url: z.string(),
  kind: z.enum(["page", "style", "probe"]),
  paths: z.strictObject({
    raw: z.string(),
  }),
  http: z.strictObject({
    status: z.number().int(),
    finalUrl: z.string(),
    redirectChain: z.array(z.string()),
    contentType: z.string().optional(),
    etag: z.string().optional(),
    lastModified: z.string().optional(),
  }),
  sha256: z.string(),
  size: z.number().int().nonnegative(),
  fetchedAt: z.iso.datetime(),
});
export type MirrorEntry = z.infer<typeof mirrorEntrySchema>;

export const MIRROR_INDEX_SCHEMA_VERSION = 2;

export const mirrorIndexSchema = z.strictObject({
  schemaVersion: z.literal(MIRROR_INDEX_SCHEMA_VERSION),
  entries: z.record(z.string(), mirrorEntrySchema),
});
export type MirrorIndex = z.infer<typeof mirrorIndexSchema>;
