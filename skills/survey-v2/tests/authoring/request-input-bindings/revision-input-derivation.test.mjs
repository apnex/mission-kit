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

test(
  "revision derives its normal-task ancestry inputs from the resolved closure",
  async () => {
    const scenario = await advanceToAwaitingAcceptance(
      await createReducerSubmissionScenario({
        mutateAuthority(authority) {
          const task = authority.profile.spec.tasks[0];
          task.requestInputBindings = [{
            inputKey: "intake_ancestry",
            selectorId: task.contextSelectors[0].id,
          }];
        },
      }),
    );
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
        executables: passRegistrySource(),
      }),
    );
    assert.equal(result.kind, "task");
    assert.equal(result.request.spec.operation.class, "revision");
    assert.deepEqual(
      result.request.spec.operation.inputs,
      {
        intake_ancestry:
          result.contextClosure.spec.layers[0].sourceReference,
      },
    );
  },
);
