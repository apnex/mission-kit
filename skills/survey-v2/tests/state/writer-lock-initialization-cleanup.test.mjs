import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { access, mkdtemp, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

test("a failed writer-lock payload write closes its handle and removes only its own lock inode.", async (t) => {
  const runDirectory = await mkdtemp(
    path.join(os.tmpdir(), "survey-v2-lock-initialization-")
  );
  t.after(() => rm(runDirectory, { recursive: true, force: true }));
  const lockPath = path.join(runDirectory, "session.lock");
  const originalOpen = fs.promises.open;
  let intercepted = false;
  let closed = false;
  fs.promises.open = async (target, ...options) => {
    const handle = await originalOpen(target, ...options);
    if (path.resolve(target) !== lockPath || intercepted) return handle;
    intercepted = true;
    return {
      stat: handle.stat.bind(handle),
      writeFile: async () => {
        const error = new Error("injected writer-lock payload failure");
        error.code = "EIO";
        throw error;
      },
      sync: handle.sync.bind(handle),
      close: async () => {
        closed = true;
        return handle.close();
      }
    };
  };
  syncBuiltinESMExports();
  try {
    const { withSessionLockOptions } = await import(
      `../../source/executables/runtime/lib/storage.mjs?lock-initialization=${Date.now()}`
    );
    await assert.rejects(
      withSessionLockOptions(runDirectory, async () => {}),
      /injected writer-lock payload failure/
    );
  } finally {
    fs.promises.open = originalOpen;
    syncBuiltinESMExports();
  }
  assert.equal(intercepted, true);
  assert.equal(closed, true);
  await assert.rejects(access(lockPath), { code: "ENOENT" });
  assert.deepEqual(
    (await readdir(runDirectory)).filter((name) =>
      name.startsWith(".session.lock.failed.")
    ),
    []
  );
});
