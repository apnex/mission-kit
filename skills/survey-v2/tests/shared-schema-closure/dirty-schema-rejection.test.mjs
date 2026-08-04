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
  findManifestMember,
  refreshOptions
} from "./support/fixture.mjs";

test("check rejects changed snapshotted schema bytes", async () => {
  const fixture = await createFixture();
  try {
    const { manifest } = await refreshSharedSchemaSnapshot(refreshOptions(fixture));
    const member = findManifestMember(
      manifest,
      "question/v1alpha1/question.schema.json"
    );
    await appendFile(path.join(fixture.packageRoot, member.snapshotPath), "\n");
    await assertClosureFailure(
      () => checkSharedSchemaSnapshot({ packageRoot: fixture.packageRoot }),
      "SNAPSHOT_DIRTY",
      /(?:dirty|digest|bytes|changed)/i
    );
  } finally {
    await fixture.cleanup();
  }
});
