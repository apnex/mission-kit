import assert from "node:assert/strict";
import test from "node:test";
import {
  checkSharedSchemaSnapshot,
  refreshSharedSchemaSnapshot
} from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  createFixture,
  refreshOptions,
  treeFingerprint
} from "./support/fixture.mjs";

test("snapshot check is strictly non-mutating", async () => {
  const fixture = await createFixture();
  try {
    await refreshSharedSchemaSnapshot(refreshOptions(fixture));
    const before = await treeFingerprint(fixture.packageRoot);
    await checkSharedSchemaSnapshot({ packageRoot: fixture.packageRoot });
    const after = await treeFingerprint(fixture.packageRoot);
    assert.deepEqual(after, before);
  } finally {
    await fixture.cleanup();
  }
});
