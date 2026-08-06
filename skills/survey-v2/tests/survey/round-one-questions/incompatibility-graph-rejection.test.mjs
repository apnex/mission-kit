import assert from "node:assert/strict";
import test from "node:test";
import {
  RoundOneQuestionsAuthorityError,
  buildRoundOneQuestionProducts,
} from "../../../source/authoring/survey/round-one-questions-authority.mjs";
import {
  roundOneQuestionsAuthorityInputs,
} from "./support.mjs";

const vectors = [
  {
    label: "composable with a pair",
    mutate(values) {
      values["q1-incompatibilities"] = ["1 + 2"];
    },
    code: "ROUND_ONE_QUESTION_RELATIONSHIP_DIVERGENT",
  },
  {
    label: "exclusive with a pair",
    mutate(values) {
      values["q2-incompatibilities"] = ["1 + 2"];
    },
    code: "ROUND_ONE_QUESTION_RELATIONSHIP_DIVERGENT",
  },
  {
    label: "mixed with no pairs",
    mutate(values) {
      values["q3-incompatibilities"] = [];
    },
    code: "ROUND_ONE_QUESTION_RELATIONSHIP_DIVERGENT",
  },
  {
    label: "mixed with the complete graph",
    mutate(values) {
      values["q3-incompatibilities"] = [
        "1 + 2",
        "1 + 3",
        "1 + 4",
        "2 + 3",
        "2 + 4",
        "3 + 4",
      ];
    },
    code: "ROUND_ONE_QUESTION_RELATIONSHIP_DIVERGENT",
  },
  {
    label: "reversed pair",
    mutate(values) {
      values["q3-incompatibilities"] = ["3 + 1"];
    },
    code: "ROUND_ONE_QUESTION_INCOMPATIBILITY_INVALID",
  },
  {
    label: "unknown position",
    mutate(values) {
      values["q3-incompatibilities"] = ["1 + 5"];
    },
    code: "ROUND_ONE_QUESTION_INCOMPATIBILITY_INVALID",
  },
  {
    label: "noncanonical pair order",
    mutate(values) {
      values["q3-incompatibilities"] = ["2 + 4", "1 + 3"];
    },
    code: "ROUND_ONE_QUESTION_INCOMPATIBILITY_ORDER_INVALID",
  },
  {
    label: "duplicate pair",
    mutate(values) {
      values["q3-incompatibilities"] = ["1 + 3", "1 + 3"];
    },
    code: "ROUND_ONE_QUESTION_FIELD_DUPLICATE",
  },
  {
    label: "nonexact delimiter",
    mutate(values) {
      values["q3-incompatibilities"] = ["1+3"];
    },
    code: "ROUND_ONE_QUESTION_FIELD_INVALID",
  },
];

test(
  "Round 1 Question authority rejects every noncanonical incompatibility graph",
  async (testContext) => {
    for (const vector of vectors) {
      await testContext.test(
        `rejects ${vector.label}`,
        () => {
          const input = roundOneQuestionsAuthorityInputs();
          vector.mutate(input.normalizedValues);
          assert.throws(
            () => buildRoundOneQuestionProducts(input),
            (error) =>
              error instanceof RoundOneQuestionsAuthorityError &&
              error.code === vector.code,
          );
        },
      );
    }
  },
);
