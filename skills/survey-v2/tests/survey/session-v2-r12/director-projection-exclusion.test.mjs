import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveCurrentQuestionProjectionRecipe,
  renderCurrentQuestionPresentation,
} from "../../../source/authoring/survey/director-question-projection.mjs";
import {
  excludedProjectionSentinels,
  expectedPresentation,
  projectionFixtureSources,
} from "./projection-support.mjs";

test(
  "current-question projection excludes sibling Question content and every non-admitted context field",
  () => {
    const sources = projectionFixtureSources();
    const serializedSources = JSON.stringify(sources);

    for (const sentinel of excludedProjectionSentinels) {
      assert.equal(
        serializedSources.includes(sentinel),
        true,
        `${sentinel} must be planted in the adversarial source fixture`,
      );
    }

    const policyLayer =
      sources.generationContextVersion.resource.spec.layers[6];
    assert.deepEqual(
      {
        ordinal: policyLayer.ordinal,
        role: policyLayer.role,
        kind: policyLayer.sourceSnapshot.kind,
      },
      {
        ordinal: 7,
        role: "policy",
        kind: "SurveyPolicySnapshot",
      },
    );

    const recipe =
      deriveCurrentQuestionProjectionRecipe(sources);
    const presentation =
      renderCurrentQuestionPresentation(recipe);
    const serializedProjections = [
      ["recipe", JSON.stringify(recipe)],
      ["rendered presentation", JSON.stringify(presentation)],
    ];

    for (const [label, serialized] of serializedProjections) {
      for (const sentinel of excludedProjectionSentinels) {
        assert.equal(
          serialized.includes(sentinel),
          false,
          `${sentinel} escaped into the ${label}`,
        );
      }
      assert.equal(
        serialized.includes("MutuallyExclusive"),
        false,
        `Question constraint internals escaped into the ${label}`,
      );
    }

    assert.deepEqual(
      recipe.sourceSelections.map(({ ordinal, role }) => ({
        ordinal,
        role,
      })),
      [
        { ordinal: 1, role: "survey-frame" },
        { ordinal: 2, role: "round-frame" },
        { ordinal: 3, role: "question-frame" },
        { ordinal: 4, role: "question" },
      ],
    );
    assert.deepEqual(presentation, expectedPresentation());
  },
);
