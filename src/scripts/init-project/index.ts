import { parseArgs } from "node:util";

import { CliUsageError } from "#lib/cli/index.ts";
import { updateStep } from "#lib/manifest/index.ts";

import { INIT_PROJECT_STEP_ID } from "./constants/ids.ts";
import { prepareProject } from "./prepare.ts";

async function main(): Promise<void> {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: { url: { type: "string" }, prepare: { type: "boolean" } },
    allowPositionals: false,
  });

  const url = values["url"];
  if (typeof url !== "string" || url === "") {
    throw new CliUsageError("Usage: tsx src/scripts/init-project/index.ts --prepare --url <sourceUrl>");
  }

  const { status, projectPath } = await prepareProject(url);
  await updateStep(projectPath, INIT_PROJECT_STEP_ID, {
    status: "done",
    finishedAt: new Date().toISOString(),
  });

  console.log(JSON.stringify({ step: INIT_PROJECT_STEP_ID, status, projectPath }));
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(error instanceof CliUsageError ? error.exitCode : 1);
}
