import assert from "node:assert/strict";
import test from "node:test";
import { workspaceRevisionState } from "../../../../source/authoring/runtime/workspace-application.mjs";
import { appendTransitionScenario } from "./support.mjs";

test("retaining the completed Receipt adds no second transition revision", () => {
  const { semanticWorkspace, workspace } = appendTransitionScenario();
  assert.deepEqual(
    workspaceRevisionState(workspace),
    workspaceRevisionState(semanticWorkspace),
  );
});
