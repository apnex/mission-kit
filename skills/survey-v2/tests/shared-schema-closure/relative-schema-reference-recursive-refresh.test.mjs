import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  createFixture,
  ids,
  readJson,
  refreshOptions,
  writeJson
} from "./support/fixture.mjs";

test("refresh recursively snapshots a schema reached through a safe relative-file reference", async () => {
  const fixture = await createFixture();
  try {
    const questionPath = path.join(
      fixture.authorityRoot,
      "question/v1alpha1/question.schema.json"
    );
    const question = await readJson(questionPath);
    question.properties.spec.properties.response.$ref =
      "./choice-response.schema.json";
    await writeJson(questionPath, question);

    const { manifest } = await refreshSharedSchemaSnapshot(refreshOptions(fixture));
    const member = manifest.schemas.find((entry) => entry.id === ids.choice);
    assert.ok(member, "relative reference target is absent from the schema closure");
    assert.equal(
      member.sourcePath,
      "question/v1alpha1/choice-response.schema.json"
    );
    assert.deepEqual(
      await readFile(path.join(fixture.packageRoot, member.snapshotPath)),
      await readFile(path.join(fixture.authorityRoot, member.sourcePath))
    );
  } finally {
    await fixture.cleanup();
  }
});
