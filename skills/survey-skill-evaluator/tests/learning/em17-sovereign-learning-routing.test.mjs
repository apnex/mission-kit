import assert from "node:assert/strict";
import test from "node:test";
import {
  baseSource,
  learningDigest,
  makeLearningProtocol,
  sourceDisposition,
} from "../helpers/learning-routing-fixture.mjs";

test("EM17 routes gated diagnostic capital while retaining direct-source outcomes as evidence only", async () => {
  const learning = await makeLearningProtocol();
  const diagnostic = learning.buildSourceRequest({
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
      sourceRequest: diagnostic,
      sourceDisposition: sourceDisposition("lc01_success"),
      learningRecordState: "LR3_HANDOFF_PENDING",
    }).transitionIds,
    ["LR04", "LR05"],
  );
  assert.deepEqual(
    learning.routeCapitalOutcome({
      sourceRequest: diagnostic,
      sourceDisposition: sourceDisposition("entry_conflict"),
      learningRecordState: "LR3_HANDOFF_PENDING",
    }).transitionIds,
    ["LR10"],
  );
  assert.deepEqual(
    learning.routeCapitalOutcome({
      sourceRequest: direct,
      sourceDisposition: sourceDisposition("entry_conflict"),
      learningRecordState: "LR3_HANDOFF_PENDING",
    }).transitionIds,
    [],
  );
});
