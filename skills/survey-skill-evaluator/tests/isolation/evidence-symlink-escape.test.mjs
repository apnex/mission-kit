import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { EvidenceFreezer } from "../../source/executables/evidence/index.mjs";
import { IntegrityError } from "../../source/executables/engine/index.mjs";

test("evidence publication rejects a symlinked blob ancestor", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "evaluator-evidence-root-"));
  const outside = await mkdtemp(join(tmpdir(), "evaluator-evidence-outside-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await mkdir(join(root, "evidence"), { recursive: true });
  await symlink(outside, join(root, "evidence", "blobs"), "dir");
  const freezer = new EvidenceFreezer({ rootPath: root });
  await assert.rejects(
    freezer.freezeJson({ protected: true }),
    (error) => error instanceof IntegrityError,
  );
});
