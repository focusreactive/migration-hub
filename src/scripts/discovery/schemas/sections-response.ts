import { z } from "zod";

const nonBlankString = z.string().min(1).regex(/\S/);

const anchorProposalSchema = z.union([
  z.strictObject({
    selector: nonBlankString,
    matchCount: z.number().int().positive(),
  }),
  z.strictObject({
    noElement: z.literal(true),
  }),
]);

const sectionResponseSchema = z.strictObject({
  order: z.number().int().nonnegative(),
  role: nonBlankString,
  summary: nonBlankString,
  anchor: anchorProposalSchema,
});

export const sectionsResponseSchema = z.strictObject({
  route: z.string().min(1),
  globals: z.array(sectionResponseSchema),
  blocks: z.array(sectionResponseSchema).min(1),
});

export type AnchorProposal = z.infer<typeof anchorProposalSchema>;
export type SectionResponse = z.infer<typeof sectionResponseSchema>;
export type SectionsResponse = z.infer<typeof sectionsResponseSchema>;

export function isNoElement(anchor: AnchorProposal): anchor is { noElement: true } {
  return "noElement" in anchor;
}
