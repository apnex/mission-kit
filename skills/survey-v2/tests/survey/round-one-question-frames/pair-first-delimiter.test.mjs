import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRoundOneQuestionFrameProducts,
} from "../../../source/authoring/survey/round-one-question-frames-authority.mjs";
import {
  roundOneQuestionFramesAuthorityInputs,
} from "./support.mjs";

test("QuestionFrame pair grammar splits only the first delimiter and preserves later delimiters as semantic text", () => {
  const input = roundOneQuestionFramesAuthorityInputs();
  input.normalizedValues["q1-terms"] = [
    "boundary | left | right remains meaningful",
  ];
  input.normalizedValues["q1-outcome-axis-anchors"] = [
    "authority | evidence | without preferred direction",
  ];
  const products = buildRoundOneQuestionFrameProducts(input);
  assert.deepEqual(
    products[0].resource.spec.terms,
    [{
      term: "boundary",
      meaning: "left | right remains meaningful",
    }],
  );
  assert.deepEqual(
    products[3].resource.spec.slots[0].outcomeAxisAnchors,
    [{
      axis: "authority",
      anchor: "evidence | without preferred direction",
    }],
  );
});
