import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  createFixture,
  refreshOptions,
  writeText
} from "./support/fixture.mjs";

test("refresh closes a side-effect-only static semantic-validator import", async () => {
  const fixture = await createFixture();
  try {
    await writeText(
      path.join(fixture.authorityRoot, "question/v1alpha1/setup.mjs"),
      "globalThis.__surveySharedSchemaSideEffect = true;\n"
    );
    await writeText(
      path.join(fixture.authorityRoot, "question/v1alpha1/question.validator.mjs"),
      [
        "import \"./setup.mjs\";",
        "export function validateQuestionSemantics() { return []; }",
        ""
      ].join("\n")
    );
    const { manifest } = await refreshSharedSchemaSnapshot(refreshOptions(fixture));
    const entry = manifest.validators.find(
      ({ sourcePath }) => sourcePath === "question/v1alpha1/question.validator.mjs"
    );
    assert.deepEqual(entry.staticImports.map(({ sourcePath }) => sourcePath), [
      "question/v1alpha1/setup.mjs"
    ]);
  } finally {
    delete globalThis.__surveySharedSchemaSideEffect;
    await fixture.cleanup();
  }
});
