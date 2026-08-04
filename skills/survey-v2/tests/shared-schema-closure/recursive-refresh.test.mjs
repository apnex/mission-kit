import assert from "node:assert/strict";
import test from "node:test";
import { refreshSharedSchemaSnapshot } from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  assertExactSnapshotBytes,
  createFixture,
  ids,
  refreshOptions
} from "./support/fixture.mjs";

test("refresh recursively snapshots the complete registered schema and validator closure", async () => {
  const fixture = await createFixture();
  try {
    const { manifest } = await refreshSharedSchemaSnapshot(refreshOptions(fixture));
    assert.deepEqual(
      manifest.schemas.map((entry) => entry.id).sort(),
      [ids.choice, ids.contextFrame, ids.metadata, ids.question].sort()
    );
    assert.equal(manifest.resources.length, 2);
    assert.equal(manifest.validators.length, 2);
    await assertExactSnapshotBytes(
      fixture.packageRoot,
      fixture.authorityRoot,
      manifest
    );
  } finally {
    await fixture.cleanup();
  }
});
