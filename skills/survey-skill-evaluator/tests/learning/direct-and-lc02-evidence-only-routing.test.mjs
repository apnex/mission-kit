import assert from "node:assert/strict";
import test from "node:test";
import {
  baseSource,
  learningDigest,
  makeLearningProtocol,
  sourceDisposition,
} from "../helpers/learning-routing-fixture.mjs";

test("direct LC01 and every LC02 outcome are evidence-only for LR", async () => {
  const learning = await makeLearningProtocol();
  const directSources = [
    learning.buildSourceRequest({
      ...baseSource("completion_reflection"),
      conceptPatternKey: "concept-1",
      completionReflectionRoot: learningDigest,
    }).request,
    learning.buildSourceRequest({
      ...baseSource("recognized_insight_trigger"),
      conceptPatternKey: "concept-1",
      recognizedInsightCaptureRoot: learningDigest,
      adjacencyEvidenceRoot: learningDigest,
    }).request,
  ];
  const payback = learning.buildSourceRequest({
    ...baseSource("post_lr4_payback_observation"),
    paybackObservationId: "payback-1",
    paybackObservationRoot: learningDigest,
    observerAuthorityId: "registered-observer",
  }).request;

  for (const sourceRequest of directSources) {
    for (const kind of ["lc01_success", "entry_conflict"]) {
      assert.equal(
        learning.routeCapitalOutcome({
          sourceRequest,
          sourceDisposition: sourceDisposition(kind, "LC01"),
          learningRecordState: "LR3_HANDOFF_PENDING",
        }).route,
        "none",
      );
    }
  }
  for (const kind of ["lc02_success", "entry_conflict"]) {
    assert.equal(
      learning.routeCapitalOutcome({
        sourceRequest: payback,
        sourceDisposition: sourceDisposition(kind, "LC02"),
        learningRecordState: "LR3_HANDOFF_PENDING",
      }).route,
      "none",
    );
  }
});
