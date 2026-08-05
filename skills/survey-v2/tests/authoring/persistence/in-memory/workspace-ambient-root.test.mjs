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

test("a resealed physical root rejects an ambient Workspace spec field", async () => {
  const harness = await createStoreHarness({
    initialize: false,
  });
  const tampered = structuredClone(harness.initialSnapshot);
  tampered.workspace.spec.ambient = "not-owned";
  tampered.workspace.spec.integrity.workspaceIntegrityDigest =
    workspaceIntegrityDigest(tampered.workspace);

  assert.throws(
    () => createInMemoryAuthoringStore({
      backing: harness.backing,
      initialSnapshots: [tampered],
      identityAuthority: harness.identity,
      authoringMachineId: "authoring-kernel",
    }),
    (error) => error.code === "STORE_WORKSPACE_INVALID",
  );
});
