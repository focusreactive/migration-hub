import { z } from "zod";

const nonBlankString = z.string().min(1).regex(/\S/);

const sectionResponseSchema = z.strictObject({
  order: z.number().int().nonnegative(),
  role: nonBlankString,
  summary: nonBlankString,
});

export const sectionsResponseSchema = z.strictObject({
  route: z.string().min(1),
  globals: z.array(sectionResponseSchema),
  blocks: z.array(sectionResponseSchema).min(1),
});

export type SectionsResponse = z.infer<typeof sectionsResponseSchema>;
