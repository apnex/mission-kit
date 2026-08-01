#!/usr/bin/env node
import path from "node:path";
import {
  applySurveyCommand,
  parseCliArguments,
  printJson,
  readPayloadArgument,
  runtimeRootFromScript
} from "../source/executables/runtime/lib/engine.mjs";

function required(args, key) {
  if (!args[key]) throw new Error(`--${key}=... is required`);
  return args[key];
}

function revision(value) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error("--expected-revision must be a non-negative integer");
  return parsed;
}

try {
  const root = runtimeRootFromScript(import.meta.url);
  const args = parseCliArguments(process.argv.slice(2));
  const payloadRoot = path.resolve(args["payload-root"] ?? process.cwd());
  const result = await applySurveyCommand(root, path.resolve(required(args, "run")), {
    event: required(args, "event"),
    eventId: required(args, "event-id"),
    expectedRevision: revision(required(args, "expected-revision")),
    payload: await readPayloadArgument(payloadRoot, args)
  }, {
    role: "proposer",
    ref: required(args, "internal-proposer-ref"),
    assertionSource: "development-cli-untrusted-proposer"
  });
  printJson({
    replayed: result.replayed,
    rejected: result.rejected,
    transitionId: result.transitionId ?? null,
    revision: result.session.revision,
    phase: result.session.phase,
    runtimeStatus: result.session.runtimeStatus,
    emission: result.emission
  });
} catch (error) {
  process.stderr.write(`${JSON.stringify({ error: error.name, code: error.code ?? null, message: error.message })}\n`);
  process.exitCode = 1;
}
