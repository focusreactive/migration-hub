import { printResponseSchema } from "#discovery/utils/print-response-schema.ts";

import { CROPS_ANCHORS_SCHEMA_STEP_ID } from "../../constants/ids.ts";
import { anchorsResponseSchema } from "../../schemas/anchors-response.ts";

export function runAnchorsSchema(projectPath: string): Promise<void> {
  return printResponseSchema(projectPath, CROPS_ANCHORS_SCHEMA_STEP_ID, anchorsResponseSchema);
}
