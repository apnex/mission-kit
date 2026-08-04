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

test("refresh rejects a catalog schema binding whose document declares a different identity", async () => {
  const fixture = await createFixture();
  try {
    const schemaPath = path.join(
      fixture.authorityRoot,
      "question/v1alpha1/question.schema.json"
    );
    const schema = await readJson(schemaPath);
    schema.$id = "urn:mission-kit:schemas:question:wrong:v1alpha1";
    await writeJson(schemaPath, schema);
    await assertClosureFailure(
      () => refreshSharedSchemaSnapshot(refreshOptions(fixture)),
      "INVALID_SCHEMA",
      /(?:schema|catalog).*(?:id|identity).*(?:differ|mismatch)|(?:differ|mismatch).*(?:id|identity)/i
    );
  } finally {
    await fixture.cleanup();
  }
});
