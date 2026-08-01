import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import {
  runCompiler,
  withPackageCopy,
} from "../composition/package-fixture.mjs";

test("every generated target has one owned recipe and complete source/compiler derivation digests", async () => {
  await withPackageCopy(async (root) => {
    const build = runCompiler(root);
    assert.equal(build.status, 0, build.stderr);
    const lock = JSON.parse(
      await readFile(join(root, "generated.lock.json"), "utf8"),
    );
    const paths = lock.generatedTargets.map((entry) => entry.path);
    assert.equal(new Set(paths).size, paths.length);
    assert.ok(
      lock.generatedTargets.every(
        (entry) =>
          typeof entry.recipeId === "string" &&
          /^[a-f0-9]{64}$/u.test(entry.recipeDigest) &&
          /^[a-f0-9]{64}$/u.test(entry.sourceAggregateDigest) &&
          /^[a-f0-9]{64}$/u.test(entry.compilerDigest) &&
          entry.sourceDigests.every((digest) => /^[a-f0-9]{64}$/u.test(digest)),
      ),
    );
  });
});
