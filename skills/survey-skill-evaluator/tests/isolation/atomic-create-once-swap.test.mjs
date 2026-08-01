import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import {
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

test("create-once rejects an identical file swapped after its no-follow open.", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "evaluator-create-once-swap-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const target = join(root, "record.json");
  const displaced = join(root, "record.displaced.json");
  const expected = Buffer.from('{"value":"expected"}');
  const changed = Buffer.from('{"value":"changed"}');
  await writeFile(target, expected, { flag: "wx" });
  const originalOpen = fs.promises.open;
  let injected = false;
  fs.promises.open = async (candidate, flags, ...options) => {
    const handle = await originalOpen(candidate, flags, ...options);
    if (
      !injected &&
      basename(String(candidate)) === basename(target) &&
      (flags & (fs.constants.O_WRONLY | fs.constants.O_RDWR)) === 0
    ) {
      injected = true;
      await rename(target, displaced);
      await writeFile(target, changed, { flag: "wx" });
    }
    return handle;
  };
  syncBuiltinESMExports();
  try {
    const { atomicCreateOnce } = await import(
      `../../source/executables/engine/atomic-fs.mjs?create-once-swap=${Date.now()}`
    );
    await assert.rejects(
      atomicCreateOnce(target, expected, { authorityRoot: root }),
      (error) => error?.name === "IntegrityError",
    );
  } finally {
    fs.promises.open = originalOpen;
    syncBuiltinESMExports();
  }
  assert.equal(injected, true);
  assert.deepEqual(await readFile(displaced), expected);
  assert.deepEqual(await readFile(target), changed);
});
