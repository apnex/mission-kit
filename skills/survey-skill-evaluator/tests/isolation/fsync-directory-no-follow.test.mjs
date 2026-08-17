import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  fsyncDirectoryNoFollow,
  IntegrityError,
} from "../../source/executables/engine/index.mjs";

test("directory durability sync rejects a symbolic-link directory operand.", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "evaluator-fsync-root-"));
  const outside = await mkdtemp(join(tmpdir(), "evaluator-fsync-outside-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  t.after(() => rm(outside, { recursive: true, force: true }));
  const linkedDirectory = join(root, "linked");
  await symlink(outside, linkedDirectory, "dir");
  await assert.rejects(
    fsyncDirectoryNoFollow(linkedDirectory),
    (error) => error instanceof IntegrityError,
  );
});
