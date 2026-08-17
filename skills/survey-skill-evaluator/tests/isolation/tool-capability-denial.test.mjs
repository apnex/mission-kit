import test from "node:test";
import assert from "node:assert/strict";
import {
  IsolatedRoleRunner,
  buildRoleCapsule,
} from "../../source/executables/isolation/index.mjs";
import { AuthorizationError } from "../../source/executables/engine/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("role tool access is denied by host capability rather than prompt instruction", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const runner = new IsolatedRoleRunner({
    rootPath: fixture.rootPath,
    allowTestInProcess: true,
    toolHandlers: { forbidden: async () => ({ leaked: true }) },
  });
  const capsule = buildRoleCapsule({
    roleClass: "semantic_judge",
    workOrderId: "judge-1",
    inputProjection: { bundle: "blind" },
    allowedTools: [],
    outputSchemaId: "judge-ballot/v1",
  });
  await assert.rejects(
    runner.run(capsule, () => async ({ tools }) => tools.call("forbidden", {})),
    (error) => error instanceof AuthorizationError,
  );
});
