import path from "node:path";
import test from "node:test";
import {
  checkSharedSchemaSnapshot,
  refreshSharedSchemaSnapshot
} from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  assertClosureFailure,
  createFixture,
  readJson,
  refreshOptions,
  writeJson
} from "./support/fixture.mjs";

test("authority-aware check rejects changed shared-authority bytes without refreshing", async () => {
  const fixture = await createFixture();
  try {
    await refreshSharedSchemaSnapshot(refreshOptions(fixture));
    const schemaPath = path.join(
      fixture.authorityRoot,
      "context-frame/v1alpha1/context-frame.schema.json"
    );
    const schema = await readJson(schemaPath);
    schema.title = "Changed after refresh";
    await writeJson(schemaPath, schema);
    await assertClosureFailure(
      () => checkSharedSchemaSnapshot(refreshOptions(fixture)),
      "AUTHORITY_DRIFT",
      /(?:authority|source).*(?:drift|changed|differs)|(?:drift|changed|differs).*(?:authority|source)/i
    );
  } finally {
    await fixture.cleanup();
  }
});
