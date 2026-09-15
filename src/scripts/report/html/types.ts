import type { CropIndexData } from "#ir/crops.ts";
import type { SectionsShardData } from "#ir/discovery.ts";

import type { ReportInput } from "../types.ts";

export interface HtmlReportInput extends ReportInput {
  shards: SectionsShardData[];
  crops: CropIndexData;
  jpegs: Map<string, Buffer>;
  heroJpeg?: Buffer | undefined;
  generatedAt: Date;
}
