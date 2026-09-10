import { z } from "zod";

export const assetIdSchema = z.string().regex(/^[0-9a-f]{16}$/);
export type AssetId = z.infer<typeof assetIdSchema>;

export const typeIdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export type TypeId = z.infer<typeof typeIdSchema>;
