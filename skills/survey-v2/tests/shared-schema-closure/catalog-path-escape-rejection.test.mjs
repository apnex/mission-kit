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

test("refresh rejects a catalog member path that escapes the authority root", async () => {
  const fixture = await createFixture();
  try {
    const catalogPath = path.join(fixture.authorityRoot, "catalog.json");
    const catalog = await readJson(catalogPath);
    catalog.schemas[0].path = "../escaped.schema.json";
    await writeJson(catalogPath, catalog);
    await assertClosureFailure(
      () => refreshSharedSchemaSnapshot(refreshOptions(fixture)),
      "UNSAFE_PATH",
      /(?:path|escape|unsafe)/i
    );
  } finally {
    await fixture.cleanup();
  }
});
