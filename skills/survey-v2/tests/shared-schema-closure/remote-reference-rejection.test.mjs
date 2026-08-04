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

test("refresh rejects a schema reference to a disallowed remote dependency", async () => {
  const fixture = await createFixture();
  try {
    const schemaPath = path.join(
      fixture.authorityRoot,
      "question/v1alpha1/question.schema.json"
    );
    const schema = await readJson(schemaPath);
    schema.properties.spec.properties.response.$ref =
      "https://example.invalid/remote.schema.json";
    await writeJson(schemaPath, schema);
    await assertClosureFailure(
      () => refreshSharedSchemaSnapshot(refreshOptions(fixture)),
      "REMOTE_REFERENCE",
      /(?:remote|disallowed|reference|scheme)/i
    );
  } finally {
    await fixture.cleanup();
  }
});
