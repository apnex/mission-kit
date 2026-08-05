import assert from "node:assert/strict";
import test from "node:test";
import {
  mutationDigest,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  deriveTransitionMachineEdges,
} from "../../../source/authoring/runtime/commit-records.mjs";
import {
  appendTransitionScenario,
  errorCode,
} from "./support.mjs";

test("one invalid declared coupling refuses the complete edge bundle", () => {
  const scenario = appendTransitionScenario({
    repeatedExternalEdges: true,
  });
  const mutation = structuredClone(scenario.mutation);
  mutation.spec.externalCouplings[1].beforeStateDigest =
    mutation.spec.externalCouplings[0].beforeStateDigest;
  mutation.spec.mutationDigest = mutationDigest(mutation);
  assert.equal(errorCode(() => deriveTransitionMachineEdges({
    mutation,
    machineHeads: scenario.machineHeads,
    authoringMachineId: "authoring-kernel",
    journalOrdinal: 2,
    identity: scenario.identity.identity,
  })), "MACHINE_EDGE_BEFORE_MISMATCH");
});
