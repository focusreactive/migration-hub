import { z } from "zod";

export const namesResponseSchema = z.strictObject({
  forms: z
    .array(
      z.strictObject({
        index: z.number().int().nonnegative(),
        label: z.string().min(1),
        fields: z.array(
          z.strictObject({
            index: z.number().int().nonnegative(),
            label: z.string().min(1),
          }),
        ),
      }),
    )
    .min(1),
});

export type NamesResponse = z.infer<typeof namesResponseSchema>;
