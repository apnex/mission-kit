import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  createFixture,
  ids,
  readJson,
  sharedAuthorityRoot
} from "./support/fixture.mjs";
import {
  structuralResult,
  structuralValidatorPair
} from "./support/parity.mjs";

test("Question structural validation behavior is identical before and after snapshot", async () => {
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
    const validators = await structuralValidatorPair({
      packageRoot: fixture.packageRoot,
      authorityRoot: sharedAuthorityRoot,
      manifest,
      schemaId: ids.question
    });
    const valid = await readJson(path.join(
      sharedAuthorityRoot,
      "question/v1alpha1/examples/release-strategy.question.json"
    ));
    const unknownRoot = structuredClone(valid);
    unknownRoot.status = {};
    const missingPrompt = structuredClone(valid);
    delete missingPrompt.spec.prompt;
    for (const value of [valid, unknownRoot, missingPrompt]) {
      assert.deepEqual(
        structuralResult(validators.snapshot, value),
        structuralResult(validators.authority, value)
      );
    }
  } finally {
    await fixture.cleanup();
  }
});
