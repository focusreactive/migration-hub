import { z } from "zod";

import type { ArtifactDef } from "#ir/artifact.ts";

export const pageKindSchema = z.enum(["static", "item"]);

export const pageRecordSchema = z.strictObject({
  route: z.string(),
  kind: pageKindSchema,
  collectionKey: z.string().optional(),
});

export const collectionRecordSchema = z.strictObject({
  key: z.string(),
  routePattern: z.string(),
  itemCount: z.number().int().nonnegative(),
});

export const pagesDataSchema = z.strictObject({
  pages: z.array(pageRecordSchema),
  collections: z.array(collectionRecordSchema),
});

export type PageRecord = z.infer<typeof pageRecordSchema>;
export type CollectionRecord = z.infer<typeof collectionRecordSchema>;
export type PagesData = z.infer<typeof pagesDataSchema>;

export const pagesArtifact: ArtifactDef<PagesData> = {
  kind: "pages",
  relativePath: "pages.json",
  dataSchema: pagesDataSchema,
};
