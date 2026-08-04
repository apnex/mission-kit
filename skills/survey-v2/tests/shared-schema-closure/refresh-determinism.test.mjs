import assert from "node:assert/strict";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  createFixture,
  refreshOptions,
  treeFingerprint
} from "./support/fixture.mjs";

test("repeated refresh publishes byte-identical deterministic snapshot state", async () => {
  const fixture = await createFixture();
  try {
    await refreshSharedSchemaSnapshot(refreshOptions(fixture));
    const first = await treeFingerprint(fixture.packageRoot);
    await refreshSharedSchemaSnapshot(refreshOptions(fixture));
    const second = await treeFingerprint(fixture.packageRoot);
    assert.deepEqual(second, first);
  } finally {
    await fixture.cleanup();
  }
});
