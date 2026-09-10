import { z } from "zod";

const sectionResponseSchema = z.strictObject({
  order: z.number().int().nonnegative(),
  role: z.string().min(1),
  summary: z.string().min(1),
});

export const sectionsResponseSchema = z.strictObject({
  route: z.string().min(1),
  globals: z.array(sectionResponseSchema),
  blocks: z.array(sectionResponseSchema).min(1),
});

export type SectionsResponse = z.infer<typeof sectionsResponseSchema>;
