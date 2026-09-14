export interface Threshold {
  low: number;
  medium: number;
}

export const COMPLEXITY_THRESHOLDS = {
  collections: { low: 3, medium: 8 },
  sectionTypes: { low: 12, medium: 40 },
  images: { low: 150, medium: 600 },
  fonts: { low: 3, medium: 5 },
  forms: { low: 1, medium: 5 },
  collectionDocuments: { low: 50, medium: 500 },
} as const satisfies Record<string, Threshold>;

export const MISSING_ALT_SHARE = 0.2;
