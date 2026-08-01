#!/usr/bin/env node
import path from "node:path";
import {
  parseCliArguments,
  presentSurvey,
  printJson,
  runtimeRootFromScript
} from "../source/executables/runtime/lib/engine.mjs";

try {
  const root = runtimeRootFromScript(import.meta.url);
  const args = parseCliArguments(process.argv.slice(2));
  if (!args.run || !args["event-id"]) throw new Error("--run and --event-id are required");
  const expectedRevision = Number(args["expected-revision"]);
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
    throw new Error("--expected-revision must be a non-negative integer");
  }
  const result = await presentSurvey(root, path.resolve(args.run), {
    eventId: args["event-id"],
    expectedRevision
  });
  printJson({
    replayed: result.replayed,
    transitionId: result.transitionId ?? null,
    revision: result.session.revision,
    phase: result.session.phase,
    payload: result.emission
  });
} catch (error) {
  process.stderr.write(`${JSON.stringify({ error: error.name, code: error.code ?? null, message: error.message })}\n`);
  process.exitCode = 1;
}
