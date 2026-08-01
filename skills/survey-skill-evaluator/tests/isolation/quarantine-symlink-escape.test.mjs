import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  IntegrityError,
  QuarantineStore,
} from "../../source/executables/engine/index.mjs";

test("quarantine publication rejects an in-root symlink ancestor before writing", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "evaluator-quarantine-root-"));
  const outside = await mkdtemp(join(tmpdir(), "evaluator-quarantine-outside-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await symlink(outside, join(root, "quarantine"), "dir");
  const quarantine = new QuarantineStore({ rootPath: root });
  await assert.rejects(
    quarantine.publish({
      scope: "request",
      scopeId: "request",
      reason: "integrity",
      detectionEvidence: {},
      admissionConsequence: "block",
    }),
    (error) => error instanceof IntegrityError,
  );
});
