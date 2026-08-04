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

test("refresh rejects a registered root without an authoritative resource binding", async () => {
  const fixture = await createFixture();
  try {
    const catalogPath = path.join(fixture.authorityRoot, "catalog.json");
    const catalog = await readJson(catalogPath);
    catalog.resources = catalog.resources.filter(({ kind }) => kind !== "ContextFrame");
    await writeJson(catalogPath, catalog);
    await assertClosureFailure(
      () => refreshSharedSchemaSnapshot(refreshOptions(fixture)),
      "ROOT_BINDING_MISMATCH",
      /(?:root|resource).*(?:binding|unbound|missing)|(?:binding|unbound|missing).*root/i
    );
  } finally {
    await fixture.cleanup();
  }
});
