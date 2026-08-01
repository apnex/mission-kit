import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  IntegrityError,
  StateStore,
} from "../../source/executables/engine/index.mjs";

test("state persistence rejects an in-root symlink ancestor before writing", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "evaluator-state-root-"));
  const outside = await mkdtemp(join(tmpdir(), "evaluator-state-outside-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await symlink(outside, join(root, "objects"), "dir");
  const store = new StateStore({ rootPath: root });
  await assert.rejects(
    store.load("sample", "object"),
    (error) => error instanceof IntegrityError,
  );
});
