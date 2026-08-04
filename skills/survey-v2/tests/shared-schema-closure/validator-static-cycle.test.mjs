import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {
  checkSharedSchemaSnapshot,
  refreshSharedSchemaSnapshot
} from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  createFixture,
  refreshOptions,
  writeText
} from "./support/fixture.mjs";

test("refresh and check admit a fully closed static semantic-validator module cycle", async () => {
  const fixture = await createFixture();
  try {
    await writeText(
      path.join(fixture.authorityRoot, "question/v1alpha1/support.mjs"),
      [
        "import { marker } from \"./question.validator.mjs\";",
        "export function issues() { return marker ? [] : []; }",
        ""
      ].join("\n")
    );
    await writeText(
      path.join(fixture.authorityRoot, "question/v1alpha1/question.validator.mjs"),
      [
        "import { issues } from \"./support.mjs\";",
        "export const marker = \"entry\";",
        "export function validateQuestionSemantics() { return issues(); }",
        ""
      ].join("\n")
    );
    const { manifest } = await refreshSharedSchemaSnapshot(refreshOptions(fixture));
    await checkSharedSchemaSnapshot({ packageRoot: fixture.packageRoot });
    assert.ok(
      manifest.validators.some(
        ({ sourcePath }) => sourcePath === "question/v1alpha1/support.mjs"
      )
    );
  } finally {
    await fixture.cleanup();
  }
});
