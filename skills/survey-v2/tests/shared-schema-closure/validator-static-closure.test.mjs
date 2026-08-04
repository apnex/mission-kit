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

test("refresh recursively closes local static imports of a catalog-bound semantic validator", async () => {
  const fixture = await createFixture();
  try {
    await writeText(
      path.join(fixture.authorityRoot, "question/v1alpha1/issue.mjs"),
      "export const noIssues = Object.freeze([]);\n"
    );
    await writeText(
      path.join(fixture.authorityRoot, "question/v1alpha1/question.validator.mjs"),
      [
        "import { noIssues } from \"./issue.mjs\";",
        "export function validateQuestionSemantics() { return noIssues; }",
        ""
      ].join("\n")
    );
    const { manifest } = await refreshSharedSchemaSnapshot(refreshOptions(fixture));
    await checkSharedSchemaSnapshot({ packageRoot: fixture.packageRoot });
    const entry = manifest.validators.find(
      ({ sourcePath }) => sourcePath === "question/v1alpha1/question.validator.mjs"
    );
    const support = manifest.validators.find(
      ({ sourcePath }) => sourcePath === "question/v1alpha1/issue.mjs"
    );
    assert.equal(entry.memberRole, "entry");
    assert.deepEqual(entry.staticImports.map(({ sourcePath }) => sourcePath), [
      "question/v1alpha1/issue.mjs"
    ]);
    assert.equal(support.memberRole, "support");
  } finally {
    await fixture.cleanup();
  }
});
