import path from "node:path";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  assertClosureFailure,
  createFixture,
  ids,
  readJson,
  refreshOptions,
  writeJson
} from "./support/fixture.mjs";

test("refresh rejects duplicate catalog schema identities", async () => {
  const fixture = await createFixture();
  try {
    const catalogPath = path.join(fixture.authorityRoot, "catalog.json");
    const catalog = await readJson(catalogPath);
    catalog.schemas.push({
      id: ids.question,
      path: "question/v1alpha1/duplicate.schema.json",
      role: "fragment"
    });
    await writeJson(catalogPath, catalog);
    await writeJson(
      path.join(fixture.authorityRoot, "question/v1alpha1/duplicate.schema.json"),
      {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: ids.question,
        type: "null"
      }
    );
    await assertClosureFailure(
      () => refreshSharedSchemaSnapshot(refreshOptions(fixture)),
      "DUPLICATE_SCHEMA_ID",
      /duplicate.*(?:id|identity)|(?:id|identity).*duplicate/i
    );
  } finally {
    await fixture.cleanup();
  }
});
