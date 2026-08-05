import assert from "node:assert/strict";
import test from "node:test";
import { canonicalize } from "../../../source/authoring/kernel/canonical.mjs";
import {
  reproduceOpenAssignment,
} from "../../../source/authoring/runtime/transaction-resources.mjs";
import {
  createIssuedTransactionScenario,
  persistIssuedAssignment,
} from "./support.mjs";

test("a fresh transaction reader reproduces exact pending Assignment resources and bytes", async () => {
  const scenario = await createIssuedTransactionScenario();
  const workspace = persistIssuedAssignment(scenario);
  const reproduced = reproduceOpenAssignment({
    profile: scenario.profile,
    workspace,
    staticInventory: [scenario.formDefinition],
    executables: scenario.executables,
  });
  assert.deepEqual(
    {
      assignment:
        canonicalize(reproduced.assignment) ===
        canonicalize(scenario.issued.assignment),
      request:
        canonicalize(reproduced.request) ===
        canonicalize(scenario.issued.request),
      context:
        canonicalize(reproduced.contextClosure) ===
        canonicalize(scenario.issued.contextClosure),
      projection:
        canonicalize(reproduced.projectionArtifact) ===
        canonicalize(scenario.issued.projectionArtifact),
      bytes:
        Buffer.compare(reproduced.viewBytes, scenario.issued.viewBytes) === 0,
    },
    {
      assignment: true,
      request: true,
      context: true,
      projection: true,
      bytes: true,
    },
  );
});
