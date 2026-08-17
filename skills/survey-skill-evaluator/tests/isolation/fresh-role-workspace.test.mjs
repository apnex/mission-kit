import test from "node:test";
import assert from "node:assert/strict";
import {
  IsolatedRoleRunner,
  buildRoleCapsule,
} from "../../source/executables/isolation/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("each role invocation receives a fresh workspace and no shared provider context", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const runner = new IsolatedRoleRunner({
    rootPath: fixture.rootPath,
    allowTestInProcess: true,
  });
  const capsule = buildRoleCapsule({
    roleClass: "learning_diagnostic_actor",
    workOrderId: "work-1",
    inputProjection: { sourceRoot: "a".repeat(64) },
    outputSchemaId: "diagnostic-contribution/v1",
  });
  const workspaces = [];
  const factory = ({ workspace }) => {
    workspaces.push(workspace);
    let invocationLocal = 0;
    return async () => ({ contribution: ++invocationLocal });
  };
  const first = await runner.run(capsule, factory);
  const second = await runner.run(capsule, factory);
  assert.notEqual(first.invocationId, second.invocationId);
  assert.notEqual(workspaces[0], workspaces[1]);
  assert.equal(first.visibility.sharedProviderThread, false);
  assert.equal(first.executionBoundary, "test_only_in_process");
  assert.equal(first.visibility.productionEligible, false);
});
