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

test("refresh rejects an unresolved transitive schema reference", async () => {
  const fixture = await createFixture();
  try {
    const schemaPath = path.join(
      fixture.authorityRoot,
      "question/v1alpha1/question.schema.json"
    );
    const schema = await readJson(schemaPath);
    schema.properties.spec.properties.response.$ref =
      "urn:mission-kit:schemas:absent:v1alpha1";
    await writeJson(schemaPath, schema);
    await assertClosureFailure(
      () => refreshSharedSchemaSnapshot(refreshOptions(fixture)),
      "UNRESOLVED_REFERENCE",
      /(?:unresolved|unknown|reference)/i
    );
  } finally {
    await fixture.cleanup();
  }
});
