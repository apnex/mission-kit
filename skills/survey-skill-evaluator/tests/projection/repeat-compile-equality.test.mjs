import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import {
  runCompiler,
  withPackageCopy,
} from "../composition/package-fixture.mjs";

test("two clean compiles produce byte-identical generated lock and package manifest", async () => {
  await withPackageCopy(async (root) => {
    const first = runCompiler(root);
    assert.equal(first.status, 0, first.stderr);
    const firstLock = await readFile(join(root, "generated.lock.json"));
    const firstManifest = await readFile(join(root, "package.manifest.json"));
    const second = runCompiler(root);
    assert.equal(second.status, 0, second.stderr);
    assert.deepEqual(await readFile(join(root, "generated.lock.json")), firstLock);
    assert.deepEqual(
      await readFile(join(root, "package.manifest.json")),
      firstManifest,
    );
  });
});
