import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  createFixture,
  readJson,
  sharedAuthorityRoot
} from "./support/fixture.mjs";
import { semanticValidatorPair } from "./support/parity.mjs";

test("Question semantic validation behavior is identical before and after snapshot", async () => {
  if (process.env.SURVEY_V2_RELOCATED === "1") {
    assert.equal(process.env.SURVEY_V2_RELOCATED, "1");
    return;
  }
  const fixture = await createFixture();
  try {
    const { manifest } = await refreshSharedSchemaSnapshot({
      packageRoot: fixture.packageRoot,
      authorityRoot: sharedAuthorityRoot
    });
    const validators = await semanticValidatorPair({
      packageRoot: fixture.packageRoot,
      authorityRoot: sharedAuthorityRoot,
      manifest,
      sourcePath: "question/v1alpha1/question.validator.mjs",
      exportName: "validateQuestionSemantics"
    });
    const valid = await readJson(path.join(
      sharedAuthorityRoot,
      "question/v1alpha1/examples/release-strategy.question.json"
    ));
    const duplicateOption = structuredClone(valid);
    duplicateOption.spec.response.options[1].id =
      duplicateOption.spec.response.options[0].id;
    const invertedCardinality = structuredClone(valid);
    invertedCardinality.spec.response.cardinality.minimum = 2;
    invertedCardinality.spec.response.cardinality.maximum = 1;
    for (const value of [valid, duplicateOption, invertedCardinality]) {
      assert.deepEqual(validators.snapshot(value), validators.authority(value));
    }
  } finally {
    await fixture.cleanup();
  }
});
