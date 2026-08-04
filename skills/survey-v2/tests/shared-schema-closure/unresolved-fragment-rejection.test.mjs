import path from "node:path";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  assertClosureFailure,
  createFixture,
  readJson,
  refreshOptions,
  writeJson
} from "./support/fixture.mjs";

test("refresh rejects an unresolved same-document JSON Pointer reference", async () => {
  const fixture = await createFixture();
  try {
    const schemaPath = path.join(
      fixture.authorityRoot,
      "question/v1alpha1/question.schema.json"
    );
    const schema = await readJson(schemaPath);
    schema.properties.spec.properties.response.$ref = "#/$defs/absent";
    await writeJson(schemaPath, schema);
    await assertClosureFailure(
      () => refreshSharedSchemaSnapshot(refreshOptions(fixture)),
      "UNRESOLVED_REFERENCE",
      /(?:fragment|pointer|unresolved)/i
    );
  } finally {
    await fixture.cleanup();
  }
});
