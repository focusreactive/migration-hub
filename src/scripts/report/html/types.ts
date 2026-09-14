import type { CropIndexData } from "#ir/crops.ts";
import type { SectionsShardData } from "#ir/discovery.ts";

import type { ReportInput } from "../types.ts";

export interface HtmlReportInput extends ReportInput {
  /** Per-route section shards, for the summaries the section cards carry. */
  shards: SectionsShardData[];
  /** What the crops phase captured, and what it did not. */
  crops: CropIndexData;
  /** Crop JPEGs by typeId, already read off disk. */
  jpegs: Map<string, Buffer>;
  /** Injected so the renderer stays deterministic in tests. */
  generatedAt: Date;
}
