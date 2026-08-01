import assert from "node:assert/strict";
import test from "node:test";
import {
  AuthorizationError,
} from "../../source/executables/engine/index.mjs";
import {
  IsolatedRoleRunner,
  buildRoleCapsule,
} from "../../source/executables/isolation/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("TE12 role invocations receive fresh workspaces and denied sibling capabilities remain evidence", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const runner = new IsolatedRoleRunner({
    rootPath: fixture.rootPath,
    allowTestInProcess: true,
    toolHandlers: {
      "fixture.allowed": async () => ({ visible: true }),
      "fixture.sibling": async () => {
        throw new Error("the denied sibling handler must never execute");
      },
    },
  });
  const capsule = buildRoleCapsule({
    roleClass: "semantic_judge",
    workOrderId: "te12-work",
    inputProjection: { blindBundleDigest: "a".repeat(64) },
    allowedTools: ["fixture.allowed"],
    writableWorkspaceId: "te12-role",
    outputSchemaId: "role-output/semantic-judge/v1",
  });
  const observedWorkspaces = [];
  const adapterFactory = ({ workspace }) => {
    observedWorkspaces.push(workspace);
    return async ({ tools }) => {
      await assert.rejects(
        tools.call("fixture.sibling", { target: "../sibling" }),
        AuthorizationError,
      );
      return { status: "completed" };
    };
  };

  const first = await runner.run(capsule, adapterFactory);
  const second = await runner.run(capsule, adapterFactory);

  assert.notEqual(first.invocationId, second.invocationId);
  assert.notEqual(observedWorkspaces[0], observedWorkspaces[1]);
  assert.equal(first.visibility.freshContext, true);
  assert.equal(first.visibility.sharedProviderThread, false);
  assert.deepEqual(first.toolEvidence.map(({ status }) => status), ["denied"]);
  assert.deepEqual(second.toolEvidence.map(({ status }) => status), ["denied"]);
});
