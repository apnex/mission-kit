import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  checkSharedSchemaSnapshot,
  refreshSharedSchemaSnapshot
} from "../../source/executables/compiler/shared-schema-closure.mjs";
import {
  assertClosureFailure,
  createFixture,
  readJson,
  refreshOptions,
  treeFingerprint,
  writeJson
} from "./support/fixture.mjs";

test("failed refresh after snapshot swap restores exact prior closure without residue", async () => {
  const fixture = await createFixture();
  try {
    await refreshSharedSchemaSnapshot(refreshOptions(fixture));
    const priorState = await treeFingerprint(fixture.packageRoot);

    const changedSchemaPath = path.join(
      fixture.authorityRoot,
      "context-frame/v1alpha1/context-frame.schema.json"
    );
    const changedSchema = await readJson(changedSchemaPath);
    changedSchema.title = "Candidate B";
    await writeJson(changedSchemaPath, changedSchema);

    await assertClosureFailure(
      () => refreshSharedSchemaSnapshot({
        ...refreshOptions(fixture),
        testHooks: {
          afterSnapshotSwapBeforeManifestCommit: async () => {
            throw new Error("injected after snapshot swap");
          }
        }
      }),
      "SOURCE_UNSTABLE",
      /(?:injected|publish|unstable)/i
    );

    assert.deepEqual(await treeFingerprint(fixture.packageRoot), priorState);
    await checkSharedSchemaSnapshot({ packageRoot: fixture.packageRoot });
    const containerEntries = await readdir(path.join(
      fixture.packageRoot,
      "dependencies/shared-schemas/v1"
    ));
    assert.deepEqual(
      containerEntries.filter((name) => (
        name.startsWith(".snapshot-stage-") ||
        name.startsWith("snapshot.backup-") ||
        name.startsWith(".closure-manifest-stage-") ||
        name.startsWith("closure.manifest.json.backup-")
      )),
      []
    );
  } finally {
    await fixture.cleanup();
  }
});
