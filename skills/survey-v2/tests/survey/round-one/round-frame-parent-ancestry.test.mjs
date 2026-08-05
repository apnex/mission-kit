import assert from "node:assert/strict";
import test from "node:test";
import {
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  buildRoundOneFrameProducts,
  RoundOneFrameAuthorityError,
} from "../../../source/authoring/survey/round-one-frame-authority.mjs";
import {
  roundOneContextClosure,
  roundOneFrameValues,
} from "./support.mjs";

test("Round 1 frame authority rejects a Survey bound to any ContextFrame other than its exact frozen parent", () => {
  const closure = roundOneContextClosure();
  const surveyLayer = closure.spec.layers[1];
  surveyLayer.sourceSnapshot.spec.surveyFrameRef = {
    ...closure.spec.layers[0].sourceReference,
    name: "different-survey-frame",
  };
  surveyLayer.sourceReference =
    resourceReferenceFrom(surveyLayer.sourceSnapshot);
  const before = structuredClone(closure);

  assert.throws(
    () => buildRoundOneFrameProducts({
      normalizedValues: roundOneFrameValues(),
      contextClosure: closure,
    }),
    (error) =>
      error instanceof RoundOneFrameAuthorityError &&
      error.code === "ROUND_ONE_PARENT_ANCESTRY_MISMATCH",
  );
  assert.deepEqual(closure, before);
});
