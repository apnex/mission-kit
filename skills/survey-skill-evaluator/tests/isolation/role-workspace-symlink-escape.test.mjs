import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readdir, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  IsolatedRoleRunner,
  buildRoleCapsule,
} from "../../source/executables/isolation/index.mjs";
import { IntegrityError } from "../../source/executables/engine/index.mjs";

test("role workspace creation rejects a symlinked workspace authority before invoking the role.", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "evaluator-role-root-"));
  const outside = await mkdtemp(join(tmpdir(), "evaluator-role-outside-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await symlink(outside, join(root, "role-workspaces"), "dir");
  const capsule = buildRoleCapsule({
    roleClass: "learning_diagnostic_actor",
    workOrderId: "symlink-escape",
    inputProjection: { source: "bounded" },
    writableWorkspaceId: "workspace",
    outputSchemaId: "diagnostic-contribution/v1",
  });
  let invoked = false;
  const runner = new IsolatedRoleRunner({
    rootPath: root,
    allowTestInProcess: true,
  });
  await assert.rejects(
    runner.run(capsule, async () => {
      invoked = true;
      return async () => ({ contribution: "unexpected" });
    }),
    (error) => error instanceof IntegrityError,
  );
  assert.equal(invoked, false);
  assert.deepEqual(await readdir(outside), []);
});
