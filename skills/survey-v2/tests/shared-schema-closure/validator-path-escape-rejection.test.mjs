import path from "node:path";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  assertClosureFailure,
  createFixture,
  refreshOptions,
  writeText
} from "./support/fixture.mjs";

test("refresh rejects a semantic-validator static import that escapes the authority root", async () => {
  const fixture = await createFixture();
  try {
    await writeText(
      path.join(fixture.temporaryRoot, "escaped.mjs"),
      "export const issues = [];\n"
    );
    await writeText(
      path.join(fixture.authorityRoot, "question/v1alpha1/question.validator.mjs"),
      [
        "import { issues } from \"../../../escaped.mjs\";",
        "export function validateQuestionSemantics() { return issues; }",
        ""
      ].join("\n")
    );
    await assertClosureFailure(
      () => refreshSharedSchemaSnapshot(refreshOptions(fixture)),
      "PATH_ESCAPE",
      /(?:import|module).*(?:escape|outside|unsafe)|(?:escape|outside|unsafe).*(?:import|module)/i
    );
  } finally {
    await fixture.cleanup();
  }
});
