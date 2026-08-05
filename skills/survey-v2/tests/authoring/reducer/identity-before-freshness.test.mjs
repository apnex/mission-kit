import assert from "node:assert/strict";
import test from "node:test";
import {
  executableDigest,
  loadReducerScenario,
  passRegistrySource,
  reducerCommandBase,
  rehashAuthority,
  trustedReducerInputs,
} from "./support.mjs";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";

test(
  "executable identity rejection precedes stale command freshness without callback dispatch",
  async () => {
    const scenario = await loadReducerScenario();
    scenario.workspace.spec.authoringState = "awaiting_acceptance";
    rehashAuthority(scenario);
    const command = {
      class: "event",
      eventId: "ACCEPT",
      base: reducerCommandBase(scenario.workspace),
      commandDigest: `sha256:${"1".repeat(64)}`,
      payloadDigest: `sha256:${"2".repeat(64)}`,
      evidenceDigest: `sha256:${"3".repeat(64)}`,
      inputs: {},
      externalCouplings: [],
    };
    scenario.workspace.spec.semanticRevision += 1;
    rehashAuthority(scenario);

    const calls = [];
    const executables = passRegistrySource({
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
    });
    executables.handlers[1].digest = executableDigest("f");

    const result = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      command,
      await trustedReducerInputs({ executables }),
    );

    assert.equal(result.kind, "rejected");
    assert.equal(
      result.issues[0].spec.code,
      "EXECUTABLE_DIGEST_MISMATCH",
    );
    assert.equal(result.issues[0].spec.boundary, "kernel.identity");
    assert.deepEqual(calls, []);
  },
);
