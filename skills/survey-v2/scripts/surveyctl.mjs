#!/usr/bin/env node
import {
  parseSurveyctlArguments,
} from "../source/executables/runtime/lib/surveyctl-arguments.mjs";
import {
  executeSurveyctlCommand,
} from "../source/executables/runtime/lib/surveyctl-engine.mjs";

function write(stream, bytes) {
  return new Promise((resolve, reject) => {
    stream.write(bytes, (error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

try {
  const options = parseSurveyctlArguments(
    process.argv.slice(2),
  );
  const { output } = await executeSurveyctlCommand(
    options,
    { stdin: process.stdin },
  );
  await write(process.stdout, output);
} catch (error) {
  const code = error?.code ?? "SURVEYCTL_FAILED";
  const message =
    error instanceof Error ? error.message : String(error);
  await write(
    process.stderr,
    Buffer.from(`surveyctl: ${code}: ${message}\n`, "utf8"),
  );
  process.exitCode = 1;
}
