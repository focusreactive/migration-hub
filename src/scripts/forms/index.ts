import { CliUsageError, parseServiceArgs } from "#lib/cli/index.ts";
import { readManifest } from "#lib/manifest/index.ts";

import { FORMS_STEP_IDS, FORMS_STEP_PREFIX } from "./constants/ids.ts";
import { runForms } from "./forms.ts";
import { runFormNamesAccept } from "./steps/names/accept.ts";
import { runFormNamesSchema } from "./steps/names/schema.ts";
import { runFormNamesSubject } from "./steps/names/subject.ts";

async function runState(projectPath: string): Promise<void> {
  const manifest = await readManifest(projectPath);
  const steps = FORMS_STEP_IDS.map((id) => ({ id, status: manifest.steps[id]?.status ?? "pending" }));

  console.log(JSON.stringify({ phase: FORMS_STEP_PREFIX, steps }));
}

async function main(): Promise<void> {
  const args = parseServiceArgs(process.argv.slice(2), {
    extraFlags: {
      "names-schema": { type: "boolean" },
      "names-subject": { type: "boolean" },
      "names-accept": { type: "boolean" },
      state: { type: "boolean" },
    },
  });

  if (args["names-schema"] === true) return runFormNamesSchema(args.projectPath);
  if (args["names-subject"] === true) return runFormNamesSubject(args.projectPath);
  if (args["names-accept"] === true) return runFormNamesAccept(args.projectPath);
  if (args["state"] === true) return runState(args.projectPath);

  return runForms(args.projectPath, args.force);
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);

  process.stderr.write(`${message}\n`);
  process.exit(error instanceof CliUsageError ? error.exitCode : 1);
}
