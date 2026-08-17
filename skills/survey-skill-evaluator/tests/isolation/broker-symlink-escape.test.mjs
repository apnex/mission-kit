import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  BrokerClaimStore,
  IntegrityError,
} from "../../source/executables/engine/index.mjs";

test("broker claims reject an in-root symlink ancestor before writing", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "evaluator-broker-root-"));
  const outside = await mkdtemp(join(tmpdir(), "evaluator-broker-outside-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  t.after(() => rm(outside, { recursive: true, force: true }));
  await symlink(outside, join(root, "broker"), "dir");
  const broker = new BrokerClaimStore({ rootPath: root });
  await assert.rejects(
    broker.create({
      claimId: "claim",
      messageDigest: "a".repeat(64),
      targetId: "target",
      operationId: "operation",
      fence: 1,
      source: {},
    }),
    (error) => error instanceof IntegrityError,
  );
});
