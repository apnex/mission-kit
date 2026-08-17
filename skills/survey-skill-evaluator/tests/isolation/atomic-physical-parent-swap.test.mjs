import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import {
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

test("an atomic replacement stays on its pinned physical parent when the lexical parent is swapped.", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "evaluator-physical-root-"));
  const outside = await mkdtemp(join(tmpdir(), "evaluator-physical-outside-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  t.after(() => rm(outside, { recursive: true, force: true }));
  const parent = join(root, "objects");
  const displacedParent = join(root, "objects.displaced");
  const target = join(parent, "record.json");
  await mkdir(parent);
  const originalRename = fs.promises.rename;
  let injected = false;
  fs.promises.rename = async (source, destination) => {
    if (
      process.platform === "linux" &&
      !injected &&
      basename(String(destination)) === basename(target) &&
      basename(String(source)).endsWith(".tmp")
    ) {
      injected = true;
      await originalRename(parent, displacedParent);
      await symlink(outside, parent, "dir");
    }
    return originalRename(source, destination);
  };
  syncBuiltinESMExports();
  try {
    const { atomicReplace } = await import(
      `../../source/executables/engine/atomic-fs.mjs?physical-parent-swap=${Date.now()}`
    );
    await atomicReplace(target, Buffer.from("bounded"), {
      authorityRoot: root,
    });
  } finally {
    fs.promises.rename = originalRename;
    syncBuiltinESMExports();
  }
  if (process.platform === "linux") {
    assert.equal(injected, true);
    assert.equal(
      await readFile(join(displacedParent, basename(target)), "utf8"),
      "bounded",
    );
    await assert.rejects(readFile(join(outside, basename(target))), {
      code: "ENOENT",
    });
  }
});
