import { CliUsageError, parseServiceArgs } from "#lib/cli/index.ts";

import { runMedia } from "./steps/media/media.ts";

async function main(): Promise<void> {
  const args = parseServiceArgs(process.argv.slice(2), {
    extraFlags: { media: { type: "boolean" } },
  });

  if (args["media"] !== true) {
    throw new CliUsageError("--media is required");
  }

  return runMedia(args.projectPath, args.force);
}

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(error instanceof CliUsageError ? error.exitCode : 1);
}
