import { COMPLEXITY_THRESHOLDS, type Threshold } from "../constants/thresholds.ts";

import type { ReportMetrics } from "./metrics.ts";

export type Rating = "Low" | "Medium" | "High";

export type ComplexityAreaId =
  | "contentModel"
  | "pageComposition"
  | "designSystem"
  | "forms"
  | "contentVolume";

export interface ComplexityArea {
  id: ComplexityAreaId;
  label: string;
  rating: Rating;
}

const RANK: Record<Rating, number> = { Low: 0, Medium: 1, High: 2 };

function rate(value: number, threshold: Threshold): Rating {
  if (value <= threshold.low) return "Low";
  if (value <= threshold.medium) return "Medium";
  return "High";
}

function highest(ratings: Rating[]): Rating {
  return ratings.reduce((worst, rating) => (RANK[rating] > RANK[worst] ? rating : worst), "Low");
}

export function assessComplexity(metrics: ReportMetrics): { areas: ComplexityArea[]; overall: Rating } {
  const areas: ComplexityArea[] = [
    {
      id: "contentModel",
      label: "Content model",
      rating: rate(metrics.collections, COMPLEXITY_THRESHOLDS.collections),
    },
    {
      id: "pageComposition",
      label: "Page composition",
      rating: rate(metrics.sectionTypes, COMPLEXITY_THRESHOLDS.sectionTypes),
    },
    {
      id: "designSystem",
      label: "Design system & assets",
      rating: highest([
        rate(metrics.images, COMPLEXITY_THRESHOLDS.images),
        rate(metrics.fonts, COMPLEXITY_THRESHOLDS.fonts),
        metrics.licensedFonts > 0 ? "Medium" : "Low",
      ]),
    },
    {
      id: "forms",
      label: "Forms & integrations",
      rating: rate(metrics.forms, COMPLEXITY_THRESHOLDS.forms),
    },
    {
      id: "contentVolume",
      label: "Content volume",
      rating: rate(metrics.collectionDocuments, COMPLEXITY_THRESHOLDS.collectionDocuments),
    },
  ];

  return { areas, overall: highest(areas.map((area) => area.rating)) };
}
