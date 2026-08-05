import assert from "node:assert/strict";
import test from "node:test";
import {
  workspaceIntegrityDigest,
} from "../../../../source/authoring/kernel/digests.mjs";
import {
  createInMemoryAuthoringStore,
} from "../../../../source/authoring/adapters/in-memory-store.mjs";
import {
  createStoreHarness,
} from "./support.mjs";

test("a resealed Workspace rejects a non-array active-head collection", async () => {
  const harness = await createStoreHarness({
    initialize: false,
  });
  const malformed = structuredClone(harness.initialSnapshot);
  malformed.workspace.spec.activeHeads = {};
  malformed.workspace.spec.integrity.workspaceIntegrityDigest =
    workspaceIntegrityDigest(malformed.workspace);

  assert.throws(
    () => createInMemoryAuthoringStore({
      backing: harness.backing,
      initialSnapshots: [malformed],
      identityAuthority: harness.identity,
      authoringMachineId: "authoring-kernel",
    }),
    (error) => error.code === "STORE_WORKSPACE_INVALID",
  );
});
