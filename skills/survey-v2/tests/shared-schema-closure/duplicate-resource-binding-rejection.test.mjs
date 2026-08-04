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

test("refresh rejects a duplicate catalog root resource binding", async () => {
  const fixture = await createFixture();
  try {
    const catalogPath = path.join(fixture.authorityRoot, "catalog.json");
    const catalog = await readJson(catalogPath);
    catalog.resources.push(structuredClone(catalog.resources[0]));
    await writeJson(catalogPath, catalog);
    await assertClosureFailure(
      () => refreshSharedSchemaSnapshot(refreshOptions(fixture)),
      "DUPLICATE_RESOURCE_BINDING",
      /duplicate.*(?:resource|binding)|(?:resource|binding).*duplicate/i
    );
  } finally {
    await fixture.cleanup();
  }
});
