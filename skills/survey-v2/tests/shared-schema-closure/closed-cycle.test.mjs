import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {
  checkSharedSchemaSnapshot,
  refreshSharedSchemaSnapshot
} from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  createFixture,
  ids,
  readJson,
  refreshOptions,
  writeJson
} from "./support/fixture.mjs";

test("refresh and check admit a fully closed cyclic schema graph", async () => {
  const fixture = await createFixture();
  try {
    const questionPath = path.join(
      fixture.authorityRoot,
      "question/v1alpha1/question.schema.json"
    );
    const contextPath = path.join(
      fixture.authorityRoot,
      "context-frame/v1alpha1/context-frame.schema.json"
    );
    const question = await readJson(questionPath);
    const contextFrame = await readJson(contextPath);
    question.properties.peer = { $ref: ids.contextFrame };
    contextFrame.properties.peer = { $ref: ids.question };
    await writeJson(questionPath, question);
    await writeJson(contextPath, contextFrame);
    const { manifest } = await refreshSharedSchemaSnapshot(refreshOptions(fixture));
    await checkSharedSchemaSnapshot({ packageRoot: fixture.packageRoot });
    assert.ok(
      manifest.schemas.find(({ id }) => id === ids.question).refTargets.includes(ids.contextFrame)
    );
    assert.ok(
      manifest.schemas.find(({ id }) => id === ids.contextFrame).refTargets.includes(ids.question)
    );
  } finally {
    await fixture.cleanup();
  }
});
