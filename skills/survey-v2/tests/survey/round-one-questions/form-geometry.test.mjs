import assert from "node:assert/strict";
import test from "node:test";
import {
  createRoundOneQuestionsFormDefinition,
} from "../../../source/authoring/survey/round-one-questions-authority.mjs";

test("Round 1 Question form fixes the exact eighteen-field semantic authorship boundary", () => {
  const form = createRoundOneQuestionsFormDefinition();
  const suffixes = [
    "prompt",
    "instruction",
    "options",
    "option-relationship",
    "incompatibilities",
    "design-rationale",
  ];
  assert.deepEqual(
    form.spec.fields.map(({ id }) => id),
    [1, 2, 3].flatMap((ordinal) =>
      suffixes.map((suffix) => `q${ordinal}-${suffix}`)
    ),
  );
  assert.deepEqual(
    form.spec.fields.map(({ ordinal }) => ordinal),
    Array.from({ length: 18 }, (_, index) => index + 1),
  );
  for (let index = 0; index < 18; index += 6) {
    assert.equal(form.spec.fields[index].type, "paragraph");
    assert.equal(form.spec.fields[index].required, true);
    assert.equal(form.spec.fields[index + 1].required, false);
    assert.equal(form.spec.fields[index + 2].type, "string-list");
    assert.deepEqual(form.spec.fields[index + 2].constraints, {
      itemMaxLength: 513,
      itemMinLength: 5,
      maxItems: 4,
      minItems: 3,
      uniqueItems: true,
    });
    assert.deepEqual(
      form.spec.fields[index + 3].constraints.members,
      ["composable", "exclusive", "mixed"],
    );
    assert.equal(form.spec.fields[index + 4].required, false);
    assert.equal(form.spec.fields[index + 5].required, true);
  }
  assert.equal(Object.isFrozen(form), true);
});
