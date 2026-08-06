import assert from "node:assert/strict";
import test from "node:test";
import {
  projectRoundOneQuestionsText,
} from "../../../source/authoring/survey/round-one-questions-projector.mjs";
import {
  roundOneQuestionsProjectorInput,
} from "./support.mjs";

test(
  "Round 1 Question projector rejects ambient selected values and reordered layers",
  async (testContext) => {
    await testContext.test(
      "rejects ambient selected-value keys",
      () => {
        const input = roundOneQuestionsProjectorInput();
        input.contextClosure.spec.layers[2]
          .selectedValue[0].ambient = "forbidden";
        const result = projectRoundOneQuestionsText(input);
        assert.equal(result.status, "reject");
        assert.equal(
          result.issues[0].code,
          "ROUND_ONE_QUESTIONS_PROJECTION_CONTEXT_INVALID",
        );
      },
    );

    await testContext.test(
      "rejects reordered semantic layers",
      () => {
        const input = roundOneQuestionsProjectorInput();
        [
          input.contextClosure.spec.layers[3],
          input.contextClosure.spec.layers[4],
        ] = [
          input.contextClosure.spec.layers[4],
          input.contextClosure.spec.layers[3],
        ];
        const result = projectRoundOneQuestionsText(input);
        assert.equal(result.status, "reject");
        assert.equal(
          result.issues[0].code,
          "ROUND_ONE_QUESTIONS_PROJECTION_CONTEXT_INVALID",
        );
      },
    );
  },
);
