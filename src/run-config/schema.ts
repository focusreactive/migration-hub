import { z } from "zod";

export const runConfigSchema = z.strictObject({
  sourceUrl: z.url(),
  projectName: z.string().min(1),
});

export type RunConfig = z.infer<typeof runConfigSchema>;
