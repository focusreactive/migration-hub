import { z } from "zod";

export const anchorsResponseSchema = z.strictObject({
  route: z.string().min(1),
  anchors: z.array(
    z.strictObject({
      order: z.number().int().nonnegative(),
      candidateIndex: z.number().int().nonnegative(),
    }),
  ),
  unmappable: z.array(z.number().int().nonnegative()).optional(),
});

export type AnchorsResponse = z.infer<typeof anchorsResponseSchema>;
