import path from "node:path";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  assertClosureFailure,
  createFixture,
  refreshOptions,
  writeText
} from "./support/fixture.mjs";

test("refresh rejects CommonJS require inside a semantic-validator module", async () => {
  const fixture = await createFixture();
  try {
    await writeText(
      path.join(fixture.authorityRoot, "question/v1alpha1/question.validator.mjs"),
      [
        "const support = require(\"./support.mjs\");",
        "export function validateQuestionSemantics() { return support.issues; }",
        ""
      ].join("\n")
    );
    await assertClosureFailure(
      () => refreshSharedSchemaSnapshot(refreshOptions(fixture)),
      "INVALID_MODULE",
      /(?:commonjs|require)/i
    );
  } finally {
    await fixture.cleanup();
  }
});
