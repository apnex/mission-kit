import path from "node:path";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  assertClosureFailure,
  createFixture,
  readJson,
  refreshOptions,
  rm,
  symlink,
  writeJson
} from "./support/fixture.mjs";

test("refresh rejects a schema authority member reached through a symbolic link", async () => {
  const fixture = await createFixture();
  try {
    const schemaPath = path.join(
      fixture.authorityRoot,
      "question/v1alpha1/question.schema.json"
    );
    const replacementPath = path.join(
      fixture.authorityRoot,
      "question/v1alpha1/question.real.json"
    );
    await writeJson(replacementPath, await readJson(schemaPath));
    await rm(schemaPath);
    await symlink("question.real.json", schemaPath);
    await assertClosureFailure(
      () => refreshSharedSchemaSnapshot(refreshOptions(fixture)),
      "SYMLINK",
      /(?:symbolic|symlink|no-follow|unsafe)/i
    );
  } finally {
    await fixture.cleanup();
  }
});
