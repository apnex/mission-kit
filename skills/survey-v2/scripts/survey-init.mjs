#!/usr/bin/env node
import {
  createSurveySession,
  parseCliArguments,
  printJson,
  runtimeRootFromScript
} from "../source/executables/runtime/lib/engine.mjs";

function required(args, key) {
  if (!args[key]) throw new Error(`--${key}=... is required`);
  return args[key];
}

function parseAxes(value) {
  const axes = value.startsWith("[")
    ? JSON.parse(value)
    : value.split(",").map((item) => item.trim()).filter(Boolean);
  if (!Array.isArray(axes) || axes.length === 0 || axes.some((item) => typeof item !== "string" || !item)) {
    throw new Error("--outcome-axes must be a non-empty JSON array or comma-separated list");
  }
  return axes;
}

try {
  const root = runtimeRootFromScript(import.meta.url);
  const args = parseCliArguments(process.argv.slice(2));
  const options = {
    slug: required(args, "slug"),
    sessionId: required(args, "session-id"),
    workItem: required(args, "work-item"),
    outcomeAxes: parseAxes(required(args, "outcome-axes")),
    directorRef: required(args, "director-ref"),
    proposerRef: required(args, "proposer-ref"),
    axiomCorpus: args["axiom-corpus"] === "true"
  };
  if (args["sessions-root"]) options.sessionsRoot = args["sessions-root"];
  if (args["registry-json"]) options.registry = JSON.parse(args["registry-json"]);
  if (args["binding-evidence"]) options.bindingEvidence = args["binding-evidence"];
  if (args["parent-session-id"]) options.parentSessionId = args["parent-session-id"];
  if (args["restart-reason"]) options.restartReason = args["restart-reason"];
  if (args["parent-evidence-json"]) options.parentEvidence = JSON.parse(args["parent-evidence-json"]);
  const result = await createSurveySession(root, options);
  printJson({
    runDirectory: result.runDirectory,
    sessionId: result.session.sessionId,
    revision: result.session.revision,
    phase: result.session.phase,
    runtimeStatus: result.session.runtimeStatus
  });
} catch (error) {
  process.stderr.write(`${JSON.stringify({ error: error.name, code: error.code ?? null, message: error.message })}\n`);
  process.exitCode = 1;
}
