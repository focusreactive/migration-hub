import { DISCOVERY_SECTIONS_SCHEMA_STEP_ID } from "../../constants/ids.ts";
import { sectionsResponseSchema } from "../../schemas/sections-response.ts";
import { printResponseSchema } from "../../utils/print-response-schema.ts";

export function runSectionsSchema(projectPath: string): Promise<void> {
  return printResponseSchema(projectPath, DISCOVERY_SECTIONS_SCHEMA_STEP_ID, sectionsResponseSchema);
}
