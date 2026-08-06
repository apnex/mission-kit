import assert from "node:assert/strict";
import test from "node:test";
import { canonicalize } from "../../../source/authoring/kernel/canonical.mjs";
import {
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  buildRoundOneQuestionProducts,
} from "../../../source/authoring/survey/round-one-questions-authority.mjs";
import {
  roundOneQuestionsAuthorityInputs,
} from "./support.mjs";

test("Round 1 Question authority deterministically creates the exact frozen seven-product and twenty-two-edge unit", () => {
  const input = roundOneQuestionsAuthorityInputs();
  const before = structuredClone(input);
  const first = buildRoundOneQuestionProducts(input);
  const second = buildRoundOneQuestionProducts(input);
  assert.deepEqual(input, before);
  assert.deepEqual(second, first);
  assert.equal(Object.isFrozen(first), true);
  assert.deepEqual(
    first.map(({ slot }) => slot),
    [
      "round-1-question-1",
      "round-1-question-2",
      "round-1-question-3",
      "round-1-question-binding-1",
      "round-1-question-binding-2",
      "round-1-question-binding-3",
      "round-1-instrument",
    ],
  );
  assert.deepEqual(
    first.map(({ resource }) => resource.kind),
    [
      "Question",
      "Question",
      "Question",
      "SurveyQuestionBinding",
      "SurveyQuestionBinding",
      "SurveyQuestionBinding",
      "RoundInstrument",
    ],
  );
  assert.equal(
    first.reduce((count, product) => count + product.dependencies.length, 0),
    22,
  );
  first.slice(0, 3).forEach(({ resource }, index) => {
    assert.deepEqual(Object.keys(resource.spec).sort(), ["prompt", "response"]);
    assert.equal(resource.apiVersion, "schemas.mission-kit/v1alpha1");
    assert.equal(resource.kind, "Question");
    assert.equal(
      first[index + 3].resource.spec.questionRef.semanticDigest,
      resourceReferenceFrom(resource).semanticDigest,
    );
  });
  const instrument = first[6];
  assert.equal(instrument.resource.spec.roundOrdinal, 1);
  assert.deepEqual(instrument.resource.spec.generationContextRef, {
    ...input.references.contextClosure,
  });
  assert.equal(instrument.resource.spec.units.length, 3);
  assert.deepEqual(
    instrument.dependencies.map(({ relation }) => relation),
    [
      "belongs-to",
      ...Array(7).fill("binds"),
      "derived-from",
      "governed-by",
    ],
  );
  const boundReferences = instrument.dependencies.slice(1, 8).map(
    ({ selector }) => {
      if (selector.mode === "context-layer") return input.references.frameSet;
      return resourceReferenceFrom(
        first.find(({ slot }) => slot === selector.slot).resource,
      );
    },
  );
  const canonical = boundReferences.map(canonicalize);
  assert.deepEqual(
    canonical,
    [...canonical].sort((left, right) =>
      Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
    ),
  );
  assert.deepEqual(instrument.dependencies[8], {
    relation: "derived-from",
    selector: { mode: "context-closure" },
  });
});
