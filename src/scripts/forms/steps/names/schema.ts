import { printResponseSchema } from "#discovery/utils/print-response-schema.ts";

import { FORMS_NAMES_SCHEMA_STEP_ID } from "../../constants/ids.ts";
import { namesResponseSchema } from "../../schemas/names-response.ts";

export function runFormNamesSchema(projectPath: string): Promise<void> {
  return printResponseSchema(projectPath, FORMS_NAMES_SCHEMA_STEP_ID, namesResponseSchema);
}
