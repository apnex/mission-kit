import assert from "node:assert/strict";
import test from "node:test";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";
import {
  advanceToAwaitingAcceptance,
  createReducerSubmissionScenario,
  passRegistrySource,
  reducerCommandBase,
  trustedReducerInputs,
} from "../reducer/support.mjs";
import {
  configureExecutionClosure,
} from "./support.mjs";

test(
  "revision rejects an unavailable staged plan before invoking its selection guard",
  async () => {
    const scenario = await advanceToAwaitingAcceptance(
      await createReducerSubmissionScenario(),
    );
    configureExecutionClosure(scenario, {
      revisionPlanIds: ["after-freeze"],
    });
    const calls = [];
    const result = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      {
        class: "revise",
        unitId: "brief-unit",
        eventId: "REVISE",
        base: reducerCommandBase(scenario.workspace),
        inputs: {},
      },
      await trustedReducerInputs({
        executables: passRegistrySource({
          guardInvoke() {
            calls.push("guard");
            return { status: "pass" };
          },
        }),
      }),
    );
    assert.equal(result.kind, "rejected");
    assert.equal(
      result.issues[0].spec.code,
      "PROFILE_EXECUTION_REVISION_UNAVAILABLE",
    );
    assert.deepEqual(calls, []);
  },
);
