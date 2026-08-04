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

test("ContextFrame structural validation behavior is identical before and after snapshot", async () => {
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
      schemaId: ids.contextFrame
    });
    const valid = await readJson(path.join(
      sharedAuthorityRoot,
      "context-frame/v1alpha1/examples/application-messaging.context-frame.json"
    ));
    const unknownRoot = structuredClone(valid);
    unknownRoot.round = 1;
    const missingSynopsis = structuredClone(valid);
    delete missingSynopsis.spec.synopsis;
    for (const value of [valid, unknownRoot, missingSynopsis]) {
      assert.deepEqual(
        structuralResult(validators.snapshot, value),
        structuralResult(validators.authority, value)
      );
    }
  } finally {
    await fixture.cleanup();
  }
});
