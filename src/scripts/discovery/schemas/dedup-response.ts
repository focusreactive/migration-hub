import { z } from "zod";

const memberResponseSchema = z.strictObject({
  route: z.string().min(1),
  order: z.number().int().nonnegative(),
});

const groupResponseSchema = z.strictObject({
  kind: z.enum(["global", "block"]),
  name: z.string().min(1),
  role: z.string().min(1),
  members: z.array(memberResponseSchema).min(1),
  exemplar: memberResponseSchema,
});

export const dedupResponseSchema = z.strictObject({
  groups: z.array(groupResponseSchema).min(1),
});

export type DedupResponse = z.infer<typeof dedupResponseSchema>;
