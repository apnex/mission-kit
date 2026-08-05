import assert from "node:assert/strict";
import test from "node:test";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";
import {
  createReducerSubmissionScenario,
  passRegistrySource,
  reducerSubmissionInventory,
  rehashAuthority,
  trustedReducerInputs,
} from "./support.mjs";

function commandBase(workspace) {
  return {
    authoringState: workspace.spec.authoringState,
    semanticRevision: workspace.spec.semanticRevision,
    semanticStateDigest: workspace.spec.integrity.semanticStateDigest,
    activeHeads: structuredClone(workspace.spec.activeHeads),
  };
}

test(
  "an exact event command rejects a changed semantic snapshot before executable dispatch",
  async () => {
    const scenario = await createReducerSubmissionScenario();
    scenario.workspace.spec.authoringState = "awaiting_acceptance";
    rehashAuthority(scenario);
    const command = {
      class: "event",
      eventId: "ACCEPT",
      base: commandBase(scenario.workspace),
      commandDigest: `sha256:${"1".repeat(64)}`,
      payloadDigest: `sha256:${"2".repeat(64)}`,
      evidenceDigest: `sha256:${"3".repeat(64)}`,
      inputs: {},
      externalCouplings: [],
    };

    scenario.workspace.spec.semanticRevision += 1;
    rehashAuthority(scenario);

    const calls = [];
    const result = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      command,
      await trustedReducerInputs({
        executables: passRegistrySource({
          guardInvoke() {
            calls.push("guard");
            return { status: "pass" };
          },
          handlerInvoke() {
            calls.push("handler");
            return { status: "accept", products: [] };
          },
          validatorInvoke() {
            calls.push("validator");
            return { status: "pass" };
          },
        }),
        inventory: reducerSubmissionInventory(scenario),
      }),
    );

    assert.equal(result.kind, "rejected");
    assert.equal(result.issues[0].spec.code, "EVENT_BASE_STALE");
    assert.equal(result.issues[0].spec.field, "/command/base");
    assert.equal(result.issues[0].spec.boundary, "kernel.freshness");
    assert.deepEqual(calls, []);
  },
);
