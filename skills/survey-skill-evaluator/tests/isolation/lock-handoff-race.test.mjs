import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

test("a lock waiter retries when the incumbent releases between EEXIST and inspection.", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "evaluator-lock-handoff-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const target = join(root, "record.json");
  const lockPath = `${target}.lock`;
  let releaseIncumbent;
  const incumbentGate = new Promise((resolvePromise) => {
    releaseIncumbent = resolvePromise;
  });
  let incumbentEntered;
  const entered = new Promise((resolvePromise) => {
    incumbentEntered = resolvePromise;
  });
  const originalLink = fs.promises.link;
  let injected = false;
  fs.promises.link = async (source, destination) => {
    try {
      return await originalLink(source, destination);
    } catch (error) {
      if (
        error?.code === "EEXIST" &&
        !injected &&
        basename(String(destination)) === basename(lockPath)
      ) {
        injected = true;
        releaseIncumbent();
        while (true) {
          try {
            await access(lockPath);
            await new Promise((resolvePromise) => setImmediate(resolvePromise));
          } catch (inspectionError) {
            if (inspectionError?.code === "ENOENT") break;
            throw inspectionError;
          }
        }
      }
      throw error;
    }
  };
  syncBuiltinESMExports();
  try {
    const { withFileLock } = await import(
      `../../source/executables/engine/atomic-fs.mjs?lock-handoff=${Date.now()}`
    );
    const incumbent = withFileLock(
      target,
      async () => {
        incumbentEntered();
        await incumbentGate;
        return "incumbent";
      },
      { authorityRoot: root },
    );
    await entered;
    const waiter = withFileLock(
      target,
      async () => "waiter",
      { authorityRoot: root, pollMs: 1 },
    );
    assert.deepEqual(await Promise.all([incumbent, waiter]), [
      "incumbent",
      "waiter",
    ]);
  } finally {
    fs.promises.link = originalLink;
    syncBuiltinESMExports();
  }
  assert.equal(injected, true);
});
