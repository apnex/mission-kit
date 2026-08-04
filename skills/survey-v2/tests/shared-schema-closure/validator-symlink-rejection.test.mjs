import path from "node:path";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  assertClosureFailure,
  createFixture,
  refreshOptions,
  rm,
  symlink,
  writeText
} from "./support/fixture.mjs";

test("refresh rejects a catalog-bound semantic validator reached through a symbolic link", async () => {
  const fixture = await createFixture();
  try {
    const entryPath = path.join(
      fixture.authorityRoot,
      "question/v1alpha1/question.validator.mjs"
    );
    await writeText(
      path.join(fixture.authorityRoot, "question/v1alpha1/question.real.mjs"),
      "export function validateQuestionSemantics() { return []; }\n"
    );
    await rm(entryPath);
    await symlink("question.real.mjs", entryPath);
    await assertClosureFailure(
      () => refreshSharedSchemaSnapshot(refreshOptions(fixture)),
      "SYMLINK",
      /(?:symbolic|symlink|no-follow)/i
    );
  } finally {
    await fixture.cleanup();
  }
});
