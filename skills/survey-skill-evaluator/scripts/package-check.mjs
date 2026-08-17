#!/usr/bin/env node
import { runCommand } from "../source/executables/cli/index.mjs";

const result = await runCommand(process.argv.slice(2), {
  forcedCommand: "package check"
});
if (Number.isInteger(result)) process.exitCode = result;
