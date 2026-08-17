import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import {
  runCompiler,
  withPackageCopy,
} from "../composition/package-fixture.mjs";

test("generated target fold excludes its own lock and the package manifest", async () => {
  await withPackageCopy(async (root) => {
    const build = runCompiler(root);
    assert.equal(build.status, 0, build.stderr);
    const lock = JSON.parse(
      await readFile(join(root, "generated.lock.json"), "utf8"),
    );
    assert.deepEqual(lock.exclusions, [
      "generated.lock.json",
      "package.manifest.json",
    ]);
    assert.equal(
      lock.generatedTargets.some((entry) =>
        lock.exclusions.includes(entry.path),
      ),
      false,
    );
  });
});
