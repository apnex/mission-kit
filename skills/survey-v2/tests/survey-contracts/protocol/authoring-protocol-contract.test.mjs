import assert from "node:assert/strict";
import test from "node:test";
import {
  validateSurveyAuthoringProtocol
} from "../../../source/authoring/survey/protocol-semantics.mjs";
import {
  assertStructurallyValid,
  loadProtocolContractSet
} from "./support.mjs";

test("the Survey AuthoringProtocol is closed and reachable with exactly eighteen states, its complete transition set, and exact task, wait, and terminal rules", async () => {
  const { authoringProtocol } = await loadProtocolContractSet();
  await assertStructurallyValid(
    "urn:mission-kit:authoring:schema:authoring-protocol:v1alpha1",
    authoringProtocol
  );
  assert.deepEqual(validateSurveyAuthoringProtocol(authoringProtocol), []);
  assert.equal(authoringProtocol.spec.states.length, 18);
  assert.deepEqual(
    authoringProtocol.spec.transitions.map((transition) => transition.id),
    [
      ...Array.from(
        { length: 16 },
        (_, index) => `AT${String(index + 1).padStart(2, "0")}`
      ),
      ...Array.from(
        { length: 5 },
        (_, index) => `AC${String(index + 1).padStart(2, "0")}`
      ),
      "AF01"
    ]
  );
  const abort = authoringProtocol.spec.transitions.at(-1);
  assert.equal(abort.source.mode, "set");
  assert.equal(abort.source.stateIds.length, 16);
  for (const state of authoringProtocol.spec.states) {
    assert.equal(
      Object.hasOwn(state, "taskId"),
      state.class === "task"
    );
  }
});
