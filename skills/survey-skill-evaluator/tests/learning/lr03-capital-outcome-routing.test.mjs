import assert from "node:assert/strict";
import test from "node:test";
import {
  baseSource,
  learningDigest,
  makeLearningProtocol,
  sourceDisposition,
} from "../helpers/learning-routing-fixture.mjs";

test("LR03 LC01 success and recovery route to distinct LR transitions", async () => {
  const learning = await makeLearningProtocol();
  const lr03 = learning.buildSourceRequest({
    ...baseSource("lr03_diagnosis"),
    conceptPatternKey: "concept-1",
    diagnosticDebateRoot: learningDigest,
  }).request;
  const direct = learning.buildSourceRequest({
    ...baseSource("completion_reflection"),
    conceptPatternKey: "concept-1",
    completionReflectionRoot: learningDigest,
  }).request;

  assert.deepEqual(
    learning.routeCapitalOutcome({
      sourceRequest: lr03,
      sourceDisposition: sourceDisposition("lc01_success"),
      learningRecordState: "LR3_HANDOFF_PENDING",
    }),
    {
      route: "ordinary_learning_handoff",
      transitionIds: ["LR04", "LR05"],
    },
  );
  assert.deepEqual(
    learning.routeCapitalOutcome({
      sourceRequest: lr03,
      sourceDisposition: sourceDisposition("entry_conflict"),
      learningRecordState: "LR3_HANDOFF_PENDING",
    }),
    {
      route: "terminal_capital_recovery",
      transitionIds: ["LR10"],
    },
  );
  assert.deepEqual(
    learning.routeCapitalOutcome({
      sourceRequest: direct,
      sourceDisposition: sourceDisposition("entry_conflict"),
      learningRecordState: "LR3_HANDOFF_PENDING",
    }),
    { route: "none", transitionIds: [] },
  );
  assert.deepEqual(
    learning.routeCapitalOutcome({
      sourceRequest: lr03,
      sourceDisposition: sourceDisposition("lc01_success"),
      learningRecordState: "LR4_CLOSED",
    }),
    { route: "none", transitionIds: [] },
  );
});
