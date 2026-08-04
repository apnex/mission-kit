import path from "node:path";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  assertClosureFailure,
  createFixture,
  refreshOptions,
  writeText
} from "./support/fixture.mjs";

test("refresh rejects a dynamically imported semantic-validator module", async () => {
  const fixture = await createFixture();
  try {
    await writeText(
      path.join(fixture.authorityRoot, "question/v1alpha1/support.mjs"),
      "export const issues = [];\n"
    );
    await writeText(
      path.join(fixture.authorityRoot, "question/v1alpha1/question.validator.mjs"),
      [
        "export async function validateQuestionSemantics() {",
        "  return (await import(\"./support.mjs\")).issues;",
        "}",
        ""
      ].join("\n")
    );
    await assertClosureFailure(
      () => refreshSharedSchemaSnapshot(refreshOptions(fixture)),
      "DYNAMIC_IMPORT",
      /dynamic.*import|import.*dynamic/i
    );
  } finally {
    await fixture.cleanup();
  }
});
