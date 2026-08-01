import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

test("lock release preserves a successor swapped in immediately before retirement.", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "evaluator-lock-release-swap-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const target = join(root, "record.json");
  const lockPath = `${target}.lock`;
  const displaced = join(root, "original-release-lock.json");
  const successor = {
    token: "successor-release-token",
    pid: process.pid,
    createdAtMs: Date.now(),
  };
  const originalRename = fs.promises.rename;
  let operationRan = false;
  let injected = false;
  fs.promises.rename = async (source, destination) => {
    if (
      !injected &&
      basename(String(source)) === basename(lockPath) &&
      basename(String(destination)).startsWith(".evaluator-lock.release.")
    ) {
      injected = true;
      await originalRename(lockPath, displaced);
      await writeFile(lockPath, JSON.stringify(successor), { flag: "wx" });
    }
    return originalRename(source, destination);
  };
  syncBuiltinESMExports();
  try {
    const { withFileLock } = await import(
      `../../source/executables/engine/atomic-fs.mjs?lock-release-swap=${Date.now()}`
    );
    await assert.rejects(
      withFileLock(
        target,
        async () => {
          operationRan = true;
        },
        { authorityRoot: root },
      ),
      (error) => error?.name === "IntegrityError",
    );
  } finally {
    fs.promises.rename = originalRename;
    syncBuiltinESMExports();
  }
  assert.equal(operationRan, true);
  assert.equal(injected, true);
  assert.equal((await readFile(displaced)).length > 0, true);
  const retained = (await readdir(root)).filter((name) =>
    name.startsWith(".evaluator-lock.release.")
  );
  assert.equal(retained.length, 1);
  assert.deepEqual(
    JSON.parse(await readFile(join(root, retained[0]), "utf8")),
    successor,
  );
});
