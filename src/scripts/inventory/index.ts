import { CliUsageError, parseServiceArgs } from "#lib/cli/index.ts";

import { runInventory } from "./inventory.ts";

async function main(): Promise<void> {
  const { projectPath, force } = parseServiceArgs(process.argv.slice(2));

  return runInventory(projectPath, force);
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(error instanceof CliUsageError ? error.exitCode : 1);
}
