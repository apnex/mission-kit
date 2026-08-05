import assert from "node:assert/strict";
import test from "node:test";
import {
  resealWorkspace,
} from "../../../source/authoring/runtime/workspace-application.mjs";
import {
  createCoordinatorHarness,
} from "../transactions/coordinator/support.mjs";
import {
  replayCoordinatorSnapshot,
} from "./coordinator-snapshot-support.mjs";

test("an empty journal rejects a resealed rewrite of the identity-bound genesis Workspace", async () => {
  const harness = await createCoordinatorHarness();
  const snapshot = await harness.store.read(harness.storeId);
  const rewritten = structuredClone(snapshot.workspace);
  rewritten.metadata.name = "rewritten-genesis-workspace";
  const workspace = resealWorkspace(rewritten);

  assert.throws(
    () => replayCoordinatorSnapshot(
      harness,
      snapshot,
      { workspace },
    ),
    (error) =>
      error.code ===
      "JOURNAL_GENESIS_WORKSPACE_INTEGRITY_MISMATCH",
  );
});
