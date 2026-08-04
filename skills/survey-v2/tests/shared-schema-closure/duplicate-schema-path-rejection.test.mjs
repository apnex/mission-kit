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

test("refresh rejects two catalog schema identities bound to the same source path", async () => {
  const fixture = await createFixture();
  try {
    const catalogPath = path.join(fixture.authorityRoot, "catalog.json");
    const catalog = await readJson(catalogPath);
    catalog.schemas.push({
      id: "urn:mission-kit:schemas:duplicate-path:v1alpha1",
      path: catalog.schemas[0].path,
      role: "fragment"
    });
    await writeJson(catalogPath, catalog);
    await assertClosureFailure(
      () => refreshSharedSchemaSnapshot(refreshOptions(fixture)),
      "DUPLICATE_SCHEMA_PATH",
      /duplicate.*path|path.*duplicate/i
    );
  } finally {
    await fixture.cleanup();
  }
});
