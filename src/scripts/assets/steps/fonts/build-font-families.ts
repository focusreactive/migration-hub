import type { FontClassification, FontFamilyRecord } from "#ir/assets.ts";

export interface ParsedFace {
  family: string;
  weight: string;
  style: "normal" | "italic";
  binaryUrl: string;
}

const HOST_CLASSIFICATION: [RegExp, FontClassification][] = [
  [/(^|\.)gstatic\.com$/i, "google"],
  [/(^|\.)googleapis\.com$/i, "google"],
  [/(^|\.)fontshare\.com$/i, "fontshare"],
  [/(^|\.)typekit\.net$/i, "adobe"],
  [/(^|\.)adobe\.com$/i, "adobe"],
];

const STYLE_RANK: Record<"normal" | "italic", number> = { normal: 0, italic: 1 };

function classify(binaryUrl: string): FontClassification {
  let host: string;
  try {
    host = new URL(binaryUrl).hostname;
  } catch {
    return "custom";
  }

  for (const [pattern, classification] of HOST_CLASSIFICATION) {
    if (pattern.test(host)) return classification;
  }
  return "custom";
}

interface FamilyEntry {
  weights: Set<string>;
  styles: Set<"normal" | "italic">;
  classification: FontClassification;
}

export function buildFontFamilies(faces: ParsedFace[], providerHosts: string[]): FontFamilyRecord[] {
  const byFamily = new Map<string, FamilyEntry>();

  for (const face of faces) {
    const entry = byFamily.get(face.family) ?? {
      weights: new Set<string>(),
      styles: new Set<"normal" | "italic">(),
      classification: classify(face.binaryUrl),
    };
    entry.weights.add(face.weight);
    entry.styles.add(face.style);
    if (entry.classification === "custom") entry.classification = classify(face.binaryUrl);
    byFamily.set(face.family, entry);
  }

  const sources: FontFamilyRecord["sources"] = providerHosts.length > 0 ? ["font-face", "webfont-load"] : ["font-face"];

  return [...byFamily.entries()]
    .map(([family, entry]) => ({
      family,
      weights: [...entry.weights].sort(),
      styles: [...entry.styles].sort((a, b) => STYLE_RANK[a] - STYLE_RANK[b]),
      classification: entry.classification,
      sources,
    }))
    .sort((a, b) => a.family.localeCompare(b.family));
}
