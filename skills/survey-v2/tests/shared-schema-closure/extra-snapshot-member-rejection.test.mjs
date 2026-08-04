import path from "node:path";
import test from "node:test";
import {
  checkSharedSchemaSnapshot,
  refreshSharedSchemaSnapshot
} from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  assertClosureFailure,
  createFixture,
  refreshOptions,
  writeText
} from "./support/fixture.mjs";

test("check rejects an unmanifested module in the local snapshot inventory", async () => {
  const fixture = await createFixture();
  try {
    const { manifest } = await refreshSharedSchemaSnapshot(refreshOptions(fixture));
    const snapshotDirectory = path.dirname(
      path.join(fixture.packageRoot, manifest.catalog.snapshotPath)
    );
    await writeText(
      path.join(snapshotDirectory, "unbound.validator.mjs"),
      "export const unbound = true;\n"
    );
    await assertClosureFailure(
      () => checkSharedSchemaSnapshot({ packageRoot: fixture.packageRoot }),
      "SNAPSHOT_INVENTORY",
      /(?:inventory|extra|unmanifested|unbound)/i
    );
  } finally {
    await fixture.cleanup();
  }
});
