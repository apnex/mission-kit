import assert from "node:assert/strict";
import test from "node:test";
import {
  checkSharedSchemaSnapshot,
} from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  assertExactSnapshotBytes,
  sharedAuthorityRoot,
  surveyRoot
} from "./support/fixture.mjs";

test("in-repository snapshot member bytes exactly equal the selected shared authority", async () => {
  if (process.env.SURVEY_V2_RELOCATED === "1") {
    await checkSharedSchemaSnapshot({ packageRoot: surveyRoot });
    return;
  }
  const options = {
    packageRoot: surveyRoot,
    authorityRoot: sharedAuthorityRoot
  };
  const { manifest } = await checkSharedSchemaSnapshot(options);
  await assertExactSnapshotBytes(surveyRoot, sharedAuthorityRoot, manifest);
  assert.equal(manifest.schemas.length, 4);
  assert.equal(manifest.validators.length, 2);
});
