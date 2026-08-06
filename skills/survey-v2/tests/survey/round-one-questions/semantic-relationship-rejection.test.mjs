import assert from "node:assert/strict";
import test from "node:test";
import {
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  createSurveyResourceResolver,
  validateSurveyResourceSemantics,
} from "../../../source/authoring/survey/resource-semantics.mjs";
import {
  buildRoundOneQuestionProducts,
} from "../../../source/authoring/survey/round-one-questions-authority.mjs";
import {
  roundOneQuestionsAuthorityInputs,
} from "./support.mjs";

const allPairs = [
  ["a", "b"],
  ["a", "c"],
  ["a", "d"],
  ["b", "c"],
  ["b", "d"],
  ["c", "d"],
];

const vectors = [
  {
    label: "reversed pair",
    code: "BINDING_INCOMPATIBILITY_PAIR_ORDER",
    mutate(binding, question) {
      binding.spec.incompatibilities = [["c", "a"], ["b", "d"]];
      question.spec.response.constraints[0].optionIds = ["c", "a"];
    },
  },
  {
    label: "unknown option",
    code: "BINDING_INCOMPATIBILITY_UNKNOWN",
    mutate(binding, question) {
      binding.spec.incompatibilities = [["a", "z"]];
      question.spec.response.constraints = [{
        type: "MutuallyExclusive",
        optionIds: ["a", "z"],
      }];
    },
  },
  {
    label: "duplicate pair",
    code: "BINDING_INCOMPATIBILITY_DUPLICATE",
    mutate(binding, question) {
      binding.spec.incompatibilities = [["a", "c"], ["a", "c"]];
      question.spec.response.constraints = [
        { type: "MutuallyExclusive", optionIds: ["a", "c"] },
        { type: "MutuallyExclusive", optionIds: ["a", "c"] },
      ];
    },
  },
  {
    label: "noncanonical pair list",
    code: "BINDING_INCOMPATIBILITY_LIST_ORDER",
    mutate(binding, question) {
      binding.spec.incompatibilities = [["b", "d"], ["a", "c"]];
      question.spec.response.constraints = [
        { type: "MutuallyExclusive", optionIds: ["b", "d"] },
        { type: "MutuallyExclusive", optionIds: ["a", "c"] },
      ];
    },
  },
  {
    label: "empty mixed graph",
    code: "BINDING_MIXED_GRAPH_CLASSIFICATION",
    mutate(binding, question) {
      binding.spec.incompatibilities = [];
      question.spec.response.constraints = [];
    },
  },
  {
    label: "complete mixed graph",
    code: "BINDING_MIXED_GRAPH_CLASSIFICATION",
    mutate(binding, question) {
      binding.spec.incompatibilities = allPairs;
      question.spec.response.constraints = allPairs.map((optionIds) => ({
        type: "MutuallyExclusive",
        optionIds,
      }));
    },
  },
  {
    label: "nonderived option ID",
    code: "BINDING_OPTION_ID_DERIVATION_MISMATCH",
    mutate(_binding, question) {
      question.spec.response.options[3].id = "x";
      question.spec.response.constraints[1].optionIds[1] = "x";
    },
  },
  {
    label: "nonderived cardinality",
    code: "BINDING_CARDINALITY_DERIVATION_MISMATCH",
    mutate(_binding, question) {
      question.spec.response.cardinality.maximum = 3;
    },
  },
];

test(
  "Survey binding semantics reject every noncanonical or nonderived relationship graph",
  async (testContext) => {
    for (const vector of vectors) {
      await testContext.test(
        `rejects ${vector.label}`,
        () => {
          const input = roundOneQuestionsAuthorityInputs();
          const products = buildRoundOneQuestionProducts(input);
          const productResources =
            products.map(({ resource }) => resource);
          const question =
            structuredClone(productResources[2]);
          const binding =
            structuredClone(productResources[5]);
          vector.mutate(binding, question);
          binding.spec.questionRef =
            resourceReferenceFrom(question);
          const resolver = createSurveyResourceResolver([
            input.resources.round,
            ...input.resources.questionFrames,
            input.resources.frameSet,
            ...productResources.slice(0, 2),
            question,
            ...productResources.slice(3, 5),
            binding,
          ]);
          const issues =
            validateSurveyResourceSemantics(binding, {
              resolveReference: resolver,
            });
          assert.ok(
            issues.some(
              ({ code }) => code === vector.code,
            ),
            JSON.stringify(issues, null, 2),
          );
        },
      );
    }
  },
);
