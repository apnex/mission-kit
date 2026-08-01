import test from "node:test";
import assert from "node:assert/strict";
import { access, mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  atomicCreateOnce,
  IntegrityError,
} from "../../source/executables/engine/index.mjs";

test("an authority root with a symlink ancestor is rejected before creating outside directories.", async (t) => {
  const base = await mkdtemp(join(tmpdir(), "evaluator-root-ancestor-"));
  const outside = await mkdtemp(join(tmpdir(), "evaluator-root-outside-"));
  t.after(() => rm(base, { recursive: true, force: true }));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await symlink(outside, join(base, "linked"), "dir");
  const authorityRoot = join(base, "linked", "authority");
  await assert.rejects(
    atomicCreateOnce(
      join(authorityRoot, "record.json"),
      Buffer.from("forbidden"),
      { authorityRoot },
    ),
    (error) => error instanceof IntegrityError,
  );
  await assert.rejects(access(join(outside, "authority")), { code: "ENOENT" });
});
