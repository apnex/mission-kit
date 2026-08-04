import path from "node:path";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  assertClosureFailure,
  createFixture,
  refreshOptions,
  writeText
} from "./support/fixture.mjs";

test("refresh rejects an unresolved named binding in a local static validator import", async () => {
  const fixture = await createFixture();
  try {
    await writeText(
      path.join(fixture.authorityRoot, "question/v1alpha1/support.mjs"),
      "export const presentBinding = [];\n"
    );
    await writeText(
      path.join(fixture.authorityRoot, "question/v1alpha1/question.validator.mjs"),
      [
        "import { absentBinding } from \"./support.mjs\";",
        "export function validateQuestionSemantics() { return absentBinding; }",
        ""
      ].join("\n")
    );
    await assertClosureFailure(
      () => refreshSharedSchemaSnapshot(refreshOptions(fixture)),
      "UNRESOLVED_IMPORT",
      /(?:absentBinding|binding).*(?:missing|unresolved|export)|(?:missing|unresolved|export).*(?:absentBinding|binding)/i
    );
  } finally {
    await fixture.cleanup();
  }
});
