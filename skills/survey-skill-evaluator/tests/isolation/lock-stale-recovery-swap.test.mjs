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

test("stale recovery preserves a successor swapped in immediately before retirement.", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "evaluator-lock-stale-swap-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const target = join(root, "record.json");
  const lockPath = `${target}.lock`;
  const displaced = join(root, "observed-stale-lock.json");
  const stale = {
    token: "stale-token",
    pid: 2_147_483_647,
    createdAtMs: 0,
  };
  const successor = {
    token: "successor-stale-token",
    pid: process.pid,
    createdAtMs: Date.now(),
  };
  await writeFile(lockPath, JSON.stringify(stale), { flag: "wx" });
  const originalRename = fs.promises.rename;
  let operationRan = false;
  let injected = false;
  fs.promises.rename = async (source, destination) => {
    if (
      !injected &&
      basename(String(source)) === basename(lockPath) &&
      basename(String(destination)).startsWith(".evaluator-lock.stale.")
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
      `../../source/executables/engine/atomic-fs.mjs?lock-stale-swap=${Date.now()}`
    );
    await assert.rejects(
      withFileLock(
        target,
        async () => {
          operationRan = true;
        },
        {
          authorityRoot: root,
          pollMs: 1,
          staleMs: 0,
          timeoutMs: 100,
        },
      ),
      (error) => error?.name === "IntegrityError",
    );
  } finally {
    fs.promises.rename = originalRename;
    syncBuiltinESMExports();
  }
  assert.equal(operationRan, false);
  assert.equal(injected, true);
  assert.deepEqual(
    JSON.parse(await readFile(displaced, "utf8")),
    stale,
  );
  const retained = (await readdir(root)).filter((name) =>
    name.startsWith(".evaluator-lock.stale.")
  );
  assert.equal(retained.length, 1);
  assert.deepEqual(
    JSON.parse(await readFile(join(root, retained[0]), "utf8")),
    successor,
  );
});
