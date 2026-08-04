import path from "node:path";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  assertClosureFailure,
  createFixture,
  refreshOptions,
  writeText
} from "./support/fixture.mjs";

test("refresh rejects a validator entry that lacks its registered semantic export", async () => {
  const fixture = await createFixture();
  try {
    await writeText(
      path.join(fixture.authorityRoot, "question/v1alpha1/question.validator.mjs"),
      "export function validateSomethingElse() { return []; }\n"
    );
    await assertClosureFailure(
      () => refreshSharedSchemaSnapshot(refreshOptions(fixture)),
      "VALIDATOR_BINDING_MISMATCH",
      /(?:does not|missing|absent|unknown).*(?:export|binding)|(?:export|binding).*(?:missing|absent|unknown)/i
    );
  } finally {
    await fixture.cleanup();
  }
});
