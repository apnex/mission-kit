import path from "node:path";
import test from "node:test";
import {
  checkSharedSchemaSnapshot,
  refreshSharedSchemaSnapshot
} from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  assertClosureFailure,
  createFixture,
  findManifestMember,
  refreshOptions,
  rm
} from "./support/fixture.mjs";

test("check rejects a missing member of the declared local snapshot", async () => {
  const fixture = await createFixture();
  try {
    const { manifest } = await refreshSharedSchemaSnapshot(refreshOptions(fixture));
    const member = findManifestMember(
      manifest,
      "common/v1alpha1/resource-metadata.schema.json"
    );
    await rm(path.join(fixture.packageRoot, member.snapshotPath));
    await assertClosureFailure(
      () => checkSharedSchemaSnapshot({ packageRoot: fixture.packageRoot }),
      "SNAPSHOT_MISSING",
      /(?:missing|absent|unavailable)/i
    );
  } finally {
    await fixture.cleanup();
  }
});
