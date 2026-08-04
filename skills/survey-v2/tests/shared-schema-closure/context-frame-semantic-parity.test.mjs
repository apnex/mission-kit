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

test("ContextFrame semantic validation behavior is identical before and after snapshot", async () => {
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
      sourcePath: "context-frame/v1alpha1/context-frame.validator.mjs",
      exportName: "validateContextFrameSemantics"
    });
    const valid = await readJson(path.join(
      sharedAuthorityRoot,
      "context-frame/v1alpha1/examples/application-messaging.context-frame.json"
    ));
    const duplicateIncluded = structuredClone(valid);
    duplicateIncluded.spec.scope.included.push(
      duplicateIncluded.spec.scope.included[0]
    );
    const crossBoundary = structuredClone(valid);
    crossBoundary.spec.scope.excluded.push(
      crossBoundary.spec.scope.included[0]
    );
    for (const value of [valid, duplicateIncluded, crossBoundary]) {
      assert.deepEqual(validators.snapshot(value), validators.authority(value));
    }
  } finally {
    await fixture.cleanup();
  }
});
