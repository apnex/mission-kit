#!/usr/bin/env node
import path from "node:path";
import {
  checkSurveyEnvelope,
  finalizeSurveyEnvelope,
  parseCliArguments,
  printJson,
  runtimeRootFromScript
} from "../source/executables/runtime/lib/engine.mjs";

try {
  const root = runtimeRootFromScript(import.meta.url);
  const args = parseCliArguments(process.argv.slice(2));
  if (!args.run) throw new Error("--run=... is required");
  const runDirectory = path.resolve(args.run);
  if (args.check === "true") {
    printJson(await checkSurveyEnvelope(runDirectory));
  } else {
    const expectedRevision = args["expected-revision"] === undefined
      ? undefined
      : Number(args["expected-revision"]);
    if (expectedRevision !== undefined && (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0)) {
      throw new Error("--expected-revision must be a non-negative integer");
    }
    const result = await finalizeSurveyEnvelope(root, runDirectory, {
      eventIdPrefix: args["event-id-prefix"] ?? "envelope",
      expectedRevision
    });
    printJson({
      replayed: result.replayed,
      revision: result.session.revision,
      phase: result.session.phase,
      handoff: result.session.finalization?.handoff ?? result.handoff ?? null
    });
  }
} catch (error) {
  process.stderr.write(`${JSON.stringify({ error: error.name, code: error.code ?? null, message: error.message })}\n`);
  process.exitCode = 1;
}
