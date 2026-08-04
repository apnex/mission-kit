import path from "node:path";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  assertClosureFailure,
  createFixture,
  refreshOptions,
  writeText
} from "./support/fixture.mjs";

test("refresh rejects an unresolved local static semantic-validator import", async () => {
  const fixture = await createFixture();
  try {
    await writeText(
      path.join(fixture.authorityRoot, "question/v1alpha1/question.validator.mjs"),
      [
        "import { issues } from \"./absent.mjs\";",
        "export function validateQuestionSemantics() { return issues; }",
        ""
      ].join("\n")
    );
    await assertClosureFailure(
      () => refreshSharedSchemaSnapshot(refreshOptions(fixture)),
      "UNRESOLVED_IMPORT",
      /(?:validator|import|module).*(?:unresolved|missing|absent|unavailable)|(?:unresolved|missing|absent|unavailable).*(?:validator|import|module)/i
    );
  } finally {
    await fixture.cleanup();
  }
});
