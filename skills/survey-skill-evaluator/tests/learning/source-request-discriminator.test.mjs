import assert from "node:assert/strict";
import test from "node:test";
import {
  baseSource,
  learningDigest,
  makeLearningProtocol,
} from "../helpers/learning-routing-fixture.mjs";

test("SourceRequest discriminator alone fixes the LC operation", async () => {
  const learning = await makeLearningProtocol();
  const completion = learning.buildSourceRequest({
    ...baseSource("completion_reflection"),
    conceptPatternKey: "concept-1",
    completionReflectionRoot: learningDigest,
  });
  const payback = learning.buildSourceRequest({
    ...baseSource("post_lr4_payback_observation"),
    paybackObservationId: "payback-1",
    paybackObservationRoot: learningDigest,
    observerAuthorityId: "registered-observer",
  });
  assert.equal(completion.request.targetOperation, "LC01");
  assert.equal(payback.request.targetOperation, "LC02");
  assert.throws(
    () =>
      learning.buildSourceRequest({
        ...baseSource("completion_reflection"),
        targetOperation: "LC02",
        conceptPatternKey: "concept-1",
        completionReflectionRoot: learningDigest,
      }),
    /cannot override/u,
  );
});
