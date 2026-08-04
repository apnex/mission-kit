import path from "node:path";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  assertClosureFailure,
  createFixture,
  refreshOptions,
  writeText
} from "./support/fixture.mjs";

test("refresh rejects a non-local semantic-validator static import", async () => {
  const fixture = await createFixture();
  try {
    await writeText(
      path.join(fixture.authorityRoot, "question/v1alpha1/question.validator.mjs"),
      [
        "import fs from \"node:fs\";",
        "export function validateQuestionSemantics() { return fs ? [] : []; }",
        ""
      ].join("\n")
    );
    await assertClosureFailure(
      () => refreshSharedSchemaSnapshot(refreshOptions(fixture)),
      "EXTERNAL_IMPORT",
      /(?:non-local|bare|node:|specifier|disallowed)/i
    );
  } finally {
    await fixture.cleanup();
  }
});
