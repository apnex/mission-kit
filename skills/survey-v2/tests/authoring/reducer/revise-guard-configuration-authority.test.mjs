import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceToAwaitingAcceptance,
  createReducerSubmissionScenario,
  passRegistrySource,
  reducerCommandBase,
  trustedReducerInputs,
} from "./support.mjs";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";

test(
  "revision guards receive the exact manifest-declared plan configuration authority",
  async () => {
    const scenario = await createReducerSubmissionScenario();
    await advanceToAwaitingAcceptance(scenario);
    let configuration;
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
          guardInvoke: (input) => {
            configuration = input.configuration;
            return { status: "pass" };
          },
        }),
      }),
    );
    assert.equal(result.kind, "task");
    assert.deepEqual(
      configuration,
      scenario.profile.spec.revisionUnits[0]
        .revisionPlans[0].authority,
    );
  },
);
