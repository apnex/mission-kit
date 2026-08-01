import test from "node:test";
import assert from "node:assert/strict";
import { access, lstat, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { withFileLock } from "../../source/executables/engine/index.mjs";

test("lock acquisition publishes one complete regular-file owner record.", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "evaluator-lock-publication-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const target = join(root, "record.json");
  const lockPath = `${target}.lock`;
  await withFileLock(
    target,
    async () => {
      const metadata = await lstat(lockPath);
      assert.equal(metadata.isFile(), true);
      assert.equal(metadata.isSymbolicLink(), false);
      const owner = JSON.parse(await readFile(lockPath, "utf8"));
      assert.deepEqual(Object.keys(owner).sort(), [
        "createdAtMs",
        "pid",
        "token",
      ]);
      assert.equal(owner.pid, process.pid);
      assert.equal(typeof owner.token, "string");
      assert.equal(Number.isSafeInteger(owner.createdAtMs), true);
    },
    { authorityRoot: root },
  );
  await assert.rejects(access(lockPath), { code: "ENOENT" });
});
