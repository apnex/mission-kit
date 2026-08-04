import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  createFixture,
  refreshOptions,
  writeText
} from "./support/fixture.mjs";

test("refresh closes a semantic-validator module reached through a named re-export", async () => {
  const fixture = await createFixture();
  try {
    await writeText(
      path.join(fixture.authorityRoot, "question/v1alpha1/question.impl.mjs"),
      "export function validateQuestionSemantics() { return []; }\n"
    );
    await writeText(
      path.join(fixture.authorityRoot, "question/v1alpha1/question.validator.mjs"),
      "export { validateQuestionSemantics } from \"./question.impl.mjs\";\n"
    );
    const { manifest } = await refreshSharedSchemaSnapshot(refreshOptions(fixture));
    const entry = manifest.validators.find(
      ({ sourcePath }) => sourcePath === "question/v1alpha1/question.validator.mjs"
    );
    assert.deepEqual(entry.staticImports.map(({ sourcePath }) => sourcePath), [
      "question/v1alpha1/question.impl.mjs"
    ]);
    assert.ok(entry.declaredExports.includes("validateQuestionSemantics"));
  } finally {
    await fixture.cleanup();
  }
});
