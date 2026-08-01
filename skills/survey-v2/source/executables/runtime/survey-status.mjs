#!/usr/bin/env node
import path from "node:path";
import {
  parseCliArguments,
  printJson,
  surveyStatus
} from "../source/executables/runtime/lib/engine.mjs";

try {
  const args = parseCliArguments(process.argv.slice(2));
  if (!args.run) throw new Error("--run=... is required");
  printJson(await surveyStatus(path.resolve(args.run)));
} catch (error) {
  process.stderr.write(`${JSON.stringify({ error: error.name, code: error.code ?? null, message: error.message })}\n`);
  process.exitCode = 1;
}
