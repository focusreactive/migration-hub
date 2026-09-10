import { z } from "zod";

export const estimateConfigSchema = z.strictObject({
  $schema: z.string().optional(),
  workspace: z.strictObject({ path: z.string() }).prefault({ path: "../estimates" }),
  crawl: z
    .strictObject({
      maxPages: z.number().int().positive().default(5000),
      concurrency: z.number().int().positive().default(4),
      requestDelayMs: z.number().int().nonnegative().default(250),
      timeoutMs: z.number().int().positive().default(30_000),
      userAgent: z.string().default("FocusReactiveEstimator/0.1 (+https://focusreactive.com)"),
    })
    .prefault({}),
  stitch: z
    .strictObject({
      viewport: z.strictObject({ width: z.number().int(), height: z.number().int() }).prefault({
        width: 1440,
        height: 900,
      }),
    })
    .prefault({}),
});

export type EstimateConfig = z.infer<typeof estimateConfigSchema>;
