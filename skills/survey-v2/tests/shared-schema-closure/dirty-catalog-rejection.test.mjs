import { appendFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  checkSharedSchemaSnapshot,
  refreshSharedSchemaSnapshot
} from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  assertClosureFailure,
  createFixture,
  refreshOptions
} from "./support/fixture.mjs";

test("check rejects changed snapshotted catalog bytes", async () => {
  const fixture = await createFixture();
  try {
    const { manifest } = await refreshSharedSchemaSnapshot(refreshOptions(fixture));
    await appendFile(
      path.join(fixture.packageRoot, manifest.catalog.snapshotPath),
      "\n"
    );
    await assertClosureFailure(
      () => checkSharedSchemaSnapshot({ packageRoot: fixture.packageRoot }),
      "SNAPSHOT_DIRTY",
      /(?:dirty|digest|bytes|changed)/i
    );
  } finally {
    await fixture.cleanup();
  }
});
