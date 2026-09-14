import { narrativeDataSchema } from "#ir/narrative.ts";

import { printResponseSchema } from "../../../discovery/utils/print-response-schema.ts";
import { REPORT_NARRATIVE_SCHEMA_STEP_ID } from "../../constants/ids.ts";

export function runNarrativeSchema(projectPath: string): Promise<void> {
  return printResponseSchema(projectPath, REPORT_NARRATIVE_SCHEMA_STEP_ID, narrativeDataSchema);
}
